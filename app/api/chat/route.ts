import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
// Use the same model as the extraction engine for consistency
const AI_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

export async function POST(req: NextRequest) {
    const token = await getToken({
        req,
        secret: process.env.AUTH_SECRET,
        secureCookie: process.env.NODE_ENV === 'production'
    });

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!GROQ_API_KEY) {
        console.error('Groq API Key missing in environment variables');
        return NextResponse.json({ error: 'System configuration error (API Key)' }, { status: 500 });
    }

    try {
        const { message, context } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const groq = new Groq({ apiKey: GROQ_API_KEY });

        // Truncate context to avoid 413 Payload Too Large or TPM limits
        // Reduced to 5000 characters (~1.2k tokens) to be extremely safe against "instant" model limits
        const safeContext = context ? context.substring(0, 5000) : "No contract context provided.";

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
