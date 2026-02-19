import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
// Use the same model as the extraction engine for consistency
const AI_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

export async function POST(req: NextRequest) {
    if (!GROQ_API_KEY) {
        return NextResponse.json({ error: 'Groq API Key not configured' }, { status: 500 });
    }

    try {
        const { message, context } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const groq = new Groq({ apiKey: GROQ_API_KEY });

        // Truncate context if necessary (Llama 3.3 has huge context, but let's be safe for speed)
        // 20k chars is plenty for most contracts
        const safeContext = context ? context.substring(0, 30000) : "No contract context provided.";

        const systemPrompt = `
        Você é um assistente jurídico especializado em contratos (ContractMind AI).
        
        Sua tarefa é responder perguntas do usuário BASEADO APENAS no texto do contrato fornecido abaixo.
        
        Diretrizes:
        1. Responda em Português (Brasil).
        2. Seja direto e cite cláusulas se possível.
        3. Se a informação não estiver no contrato, diga "Não encontrei essa informação no documento".
        4. O usuário pode perguntar sobre multas, prazos, obrigações, etc.
        
        Texto do Contrato:
        """
        ${safeContext}
        """
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            model: AI_MODEL,
            temperature: 0.2, // Low temp for factual accuracy
            max_tokens: 1024,
            stream: false
        });

        const reply = completion.choices[0]?.message?.content || "Desculpe, não consegui processar sua resposta.";

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error('[Chat API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process chat request' },
            { status: 500 }
        );
    }
}
