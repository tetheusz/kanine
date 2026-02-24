import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { transactions } from '@/drizzle/schema';
import * as XLSX from 'xlsx';

// GET — Download template Excel
export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const isTemplate = url.searchParams.get('template') === 'true';

    if (!isTemplate) {
        return NextResponse.json({ error: 'Use ?template=true' }, { status: 400 });
    }

    const headers = ['descricao', 'valor', 'tipo', 'data', 'metodo_pagamento', 'status', 'observacoes'];
    const examples = [
        ['Pagamento Fornecedor ABC', '1500.50', 'expense', '2026-02-15', 'pix', 'confirmed', 'Nota fiscal #123'],
        ['Recebimento Cliente XYZ', '3200.00', 'income', '2026-02-10', 'transferencia', 'confirmed', 'Ref: contrato mensal'],
        ['Aluguel escritório', '2800.00', 'expense', '2026-02-01', 'boleto', 'confirmed', ''],
        ['Venda produto A', '450.00', 'income', '2026-02-20', 'cartao', 'pending', ''],
        ['Material de escritório', '89.90', 'expense', '2026-02-18', 'dinheiro', 'confirmed', 'Papelaria'],
    ];

    const wsData = [headers, ...examples];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws['!cols'] = [
        { wch: 30 }, // descricao
        { wch: 12 }, // valor
        { wch: 10 }, // tipo
        { wch: 12 }, // data
        { wch: 18 }, // metodo_pagamento
        { wch: 12 }, // status
        { wch: 30 }, // observacoes
    ];

    // Instructions sheet
    const instrData = [
        ['INSTRUÇÕES DE PREENCHIMENTO'],
        [''],
        ['Coluna', 'Obrigatório', 'Formato', 'Valores aceitos'],
        ['descricao', 'SIM', 'Texto livre', 'Ex: Pagamento fornecedor'],
        ['valor', 'SIM', 'Número decimal', 'Ex: 1500.50 (use ponto como separador)'],
        ['tipo', 'SIM', 'income ou expense', 'income = Entrada | expense = Saída'],
        ['data', 'SIM', 'AAAA-MM-DD', 'Ex: 2026-02-15'],
        ['metodo_pagamento', 'NÃO', 'Texto', 'pix, boleto, cartao, dinheiro, transferencia'],
        ['status', 'NÃO', 'Texto', 'confirmed (padrão), pending, cancelled'],
        ['observacoes', 'NÃO', 'Texto livre', 'Notas opcionais'],
        [''],
        ['DICAS:'],
        ['• Não altere os nomes das colunas na primeira linha da aba "Transacoes"'],
        ['• Remova as linhas de exemplo antes de importar'],
        ['• O valor deve usar PONTO como separador decimal (1500.50, não 1500,50)'],
        ['• A data deve estar no formato AAAA-MM-DD'],
        ['• Linhas com erros serão reportadas, mas as válidas serão importadas normalmente'],
    ];
    const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
    wsInstr['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 50 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transacoes');
    XLSX.utils.book_append_sheet(wb, wsInstr, 'Instrucoes');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="template_transacoes.xlsx"',
        },
    });
}

// POST — Import transactions from Excel
export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = Number(token.companyId);
    const userId = Number(token.id);

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) return NextResponse.json({ success: 0, errors: ['Nenhum arquivo enviado'] });

        const buffer = Buffer.from(await file.arrayBuffer());
        const wb = XLSX.read(buffer, { type: 'buffer' });

        // Find the data sheet (first sheet or "Transacoes")
        const sheetName = wb.SheetNames.includes('Transacoes') ? 'Transacoes' : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws);

        const errors: string[] = [];
        let successCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const lineNum = i + 2; // +2 because row 1 is header, data starts at 2

            // Normalize column names (handle uppercase, spaces, etc.)
            const normalized: Record<string, any> = {};
            for (const key of Object.keys(row)) {
                normalized[key.toLowerCase().trim().replace(/\s+/g, '_')] = row[key];
            }

            const description = String(normalized.descricao || normalized.description || '').trim();
            const rawAmount = normalized.valor || normalized.amount || normalized.value;
            const type = String(normalized.tipo || normalized.type || '').toLowerCase().trim();
            const rawDate = normalized.data || normalized.date;
            const paymentMethod = String(normalized.metodo_pagamento || normalized.metodo || normalized.payment_method || 'pix').toLowerCase().trim();
            const status = String(normalized.status || 'confirmed').toLowerCase().trim();
            const notes = String(normalized.observacoes || normalized.notes || normalized.obs || '').trim();

            // Validate required fields
            if (!description) { errors.push(`Linha ${lineNum}: "descricao" vazio`); continue; }
            if (!rawAmount && rawAmount !== 0) { errors.push(`Linha ${lineNum}: "valor" vazio`); continue; }
            if (!type || !['income', 'expense'].includes(type)) { errors.push(`Linha ${lineNum}: "tipo" deve ser "income" ou "expense" (encontrado: "${type}")`); continue; }

            // Parse amount
            const amount = parseFloat(String(rawAmount).replace(',', '.'));
            if (isNaN(amount) || amount <= 0) { errors.push(`Linha ${lineNum}: "valor" inválido: ${rawAmount}`); continue; }

            // Parse date
            let dateStr: string;
            if (typeof rawDate === 'number') {
                // Excel serial date
                const d = XLSX.SSF.parse_date_code(rawDate);
                dateStr = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
            } else {
                dateStr = String(rawDate || '').trim();
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                // Try DD/MM/YYYY format
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) { errors.push(`Linha ${lineNum}: "data" inválida: ${rawDate} (use AAAA-MM-DD ou DD/MM/AAAA)`); continue; }

            // Validate payment method
            const validMethods = ['pix', 'boleto', 'cartao', 'dinheiro', 'transferencia'];
            const finalMethod = validMethods.includes(paymentMethod) ? paymentMethod : 'pix';

            // Validate status
            const validStatuses = ['confirmed', 'pending', 'cancelled'];
            const finalStatus = validStatuses.includes(status) ? status : 'confirmed';

            try {
                await db.insert(transactions).values({
                    description,
                    amount: amount.toFixed(2),
                    type,
                    date: dateStr,
                    paymentMethod: finalMethod,
                    status: finalStatus,
                    notes: notes || null,
                    companyId,
                    createdBy: userId,
                });
                successCount++;
            } catch (err: any) {
                errors.push(`Linha ${lineNum}: Erro ao salvar — ${err.message?.slice(0, 80)}`);
            }
        }

        return NextResponse.json({ success: successCount, errors, total: rows.length });
    } catch (err: any) {
        return NextResponse.json({ success: 0, errors: [`Erro ao processar arquivo: ${err.message}`] }, { status: 500 });
    }
}
