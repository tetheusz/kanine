import Groq from 'groq-sdk';

/**
 * ContractMind — AI Extraction Engine
 * Hybrid extraction: regex baseline + optional AI enrichment (Groq/Llama3)
 */

// ==========================================
// CONFIGURATION
// ==========================================
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const AI_ENABLED = process.env.AI_ENABLED === 'true';
// Default model updated to prevent "Decommissioned" error if env is missing
const AI_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

// Rate Limiting (Simple In-Memory) for Groq
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
let requestCount = 0;
let windowStart = Date.now();

function canMakeAIRequest(): boolean {
    const now = Date.now();
    if (now - windowStart > RATE_LIMIT_WINDOW) {
        requestCount = 0;
        windowStart = now;
    }
    if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }
    requestCount++;
    return true;
}

// ==========================================
// TYPES
// ==========================================
export interface ExtractedMetadata {
    filename: string;
    parties: string;
    signatureDate: string;
    expiryDate: string;
    value: string;
    cancellationClauses: string;
    summary: string;
    extractionMethod: 'regex' | 'regex+ai';
    aiError?: string;
    rawText?: string;
}

// ==========================================
// REGEX ENGINE (BASELINE)
// ==========================================
const MONTHS_PT: Record<string, string> = {
    janeiro: '01', fevereiro: '02', março: '03', abril: '04', maio: '05', junho: '06',
    julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12',
};

const DATE_PATTERNS = [
    /(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{4})/g,
    /(\d{1,2}\s+de\s+(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+\d{4})/gi,
];

const MONEY_PATTERN = /R\$\s*[\d]{1,3}(?:[.\s]\d{3})*(?:,\d{2})?/g;

const PARTY_KEYWORDS = [
    /(?:CONTRATANTE|CONTRATADA|CONTRATADO|LOCADOR|LOCATÁRIO|LOCATÁRIA|PRESTADOR|TOMADOR|CEDENTE|CESSIONÁRIO|OUTORGANTE|OUTORGADO)[:\s]+([^\n,;]{5,80})/gi,
];

const CANCELLATION_KEYWORDS = [
    'rescisão', 'cancelamento', 'distrato', 'resilição', 'denúncia', 'multa rescisória',
    'rescindido', 'término antecipado', 'cláusula.*rescis', 'penalidade', 'aviso prévio',
];

function normalizeDateBR(raw: string): string {
    raw = raw.trim();
    const extenso = raw.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
    if (extenso) {
        const day = extenso[1].padStart(2, '0');
        const month = MONTHS_PT[extenso[2].toLowerCase()] || '01';
        const year = extenso[3];
        return `${year}-${month}-${day}`;
    }
    const parts = raw.split(/[/\-\.]/);
    if (parts.length === 3) {
        const [d, m, y] = parts;
        if (y.length === 4 && d.length <= 2) {
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
    }
    return raw;
}

function extractDatesRegex(text: string): string[] {
    const dates: string[] = [];
    for (const pattern of DATE_PATTERNS) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const normalized = normalizeDateBR(match[1]);
            if (!dates.includes(normalized)) dates.push(normalized);
        }
    }
    return dates;
}

function extractMoneyRegex(text: string): string[] {
    const matches = text.matchAll(MONEY_PATTERN);
    return Array.from(matches, (m) => m[0]);
}

function extractPartiesRegex(text: string): string[] {
    const parties: string[] = [];
    for (const pattern of PARTY_KEYWORDS) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const clean = match[1].trim().replace(/\.$/, '');
            if (clean && !parties.includes(clean)) parties.push(clean);
        }
    }
    return parties;
}

function extractCancellationRegex(text: string): string {
    const lines = text.split('\n');
    const relevantLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        for (const keyword of CANCELLATION_KEYWORDS) {
            if (new RegExp(keyword, 'i').test(lines[i])) {
                const snippet = lines.slice(i, i + 3).join(' ').trim();
                if (snippet && !relevantLines.includes(snippet)) relevantLines.push(snippet);
                break;
            }
        }
        if (relevantLines.length >= 3) break;
    }
    return relevantLines.length > 0 ? relevantLines.join(' | ').substring(0, 500) : 'Não identificado';
}

function generateSummaryRegex(text: string): string {
    const paragraphs = text.split('\n\n').map(p => p.trim()).filter(p => p.length > 50);
    if (paragraphs.length > 0) {
        const summary = paragraphs[0].substring(0, 300);
        return paragraphs[0].length > 300 ? summary + '...' : summary;
    }
    return text.substring(0, 300) + '...';
}

export function extractMetadataRegex(text: string): ExtractedMetadata {
    const dates = extractDatesRegex(text);
    const money = extractMoneyRegex(text);
    const parties = extractPartiesRegex(text);
    const cancellation = extractCancellationRegex(text);
    const summary = generateSummaryRegex(text);

    return {
        filename: 'Documento PDF',
        parties: parties.length > 0 ? parties.join(' e ') : 'Não identificado',
        signatureDate: dates[0] || 'Não identificado',
        expiryDate: dates[1] || 'Não identificado',
        value: money[0] || 'Não identificado',
        cancellationClauses: cancellation,
        summary,
        extractionMethod: 'regex',
        rawText: text
    };
}

// ==========================================
// PDF TEXT EXTRACTION
// ==========================================
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    const PDFParser = require('pdf2json');
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        pdfParser.on('pdfParser_dataError', (errData: any) => reject(new Error(errData.parserError)));
        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
            try {
                let fullText = '';
                // Safer iteration to prevent "decodeURIComponent" crashes on bad chars
                if (pdfData && pdfData.Pages) {
                    for (const page of pdfData.Pages) {
                        for (const textItem of page.Texts) {
                            try {
                                const raw = textItem.R[0].T;
                                fullText += decodeURIComponent(raw) + ' ';
                            } catch {
                                // Fallback: use raw text if decode fails
                                if (textItem?.R?.[0]?.T) fullText += textItem.R[0].T + ' ';
                            }
                        }
                        fullText += '\n';
                    }
                }
                resolve(fullText);
            } catch (e) {
                console.error("PDF Parsing Critical Error:", e);
                resolve("");
            }
        });
        pdfParser.parseBuffer(buffer);
    });
}

// ==========================================
// AI REFINEMENT (MULTI-PROVIDER)
// ==========================================
import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq'; // 'groq' | 'gemini'

// Fallback model if primary fails (High availability)
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

async function refineMetadata(text: string, regexData: ExtractedMetadata): Promise<ExtractedMetadata> {
    const truncatedText = text.substring(0, 15000); // 15k chars is safe for both (Gemini supports way more)

    const prompt = `
    Analyze the following contract text and correct/refine the extracted metadata.
    Output ONLY valid JSON.
    
    Context (Regex Results):
    - Parties: ${regexData.parties}
    - Value: ${regexData.value}
    - Dates: ${regexData.signatureDate} to ${regexData.expiryDate}

    Contract Text:
    """
    ${truncatedText}
    """

    Instructions:
    1. Extract the TOTAL CONTRACT VALUE explicitly. Look for "Valor Global", "Valor Total", or monthly value * duration.
       - Format as "R$ X.XXX,XX". 
       - If it's a monthly fee, state "R$ X (Mensal)".
    2. Identify the PARTIES involved (Contractor and Contracted).
    3. Find SIGNATURE and EXPIRY dates.
    4. Write a DETAILED SUMMARY in PORTUGUESE (PT-BR). 
       - Cover: Object of the contract, Main Obligations, Validity/Term, and Value.
       - Use 2-3 sentences to be concise but informative.
    5. Check for CANCELLATION notice period (e.g. "30 dias de aviso prévio") and fines.

    JSON Schema:
    {
        "parties": "string",
        "signatureDate": "YYYY-MM-DD",
        "expiryDate": "YYYY-MM-DD",
        "value": "string",
        "cancellationClauses": "string",
        "summary": "string"
    }
    `;

    try {
        let content = '';

        if (AI_PROVIDER === 'gemini') {
            if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY not set');
            console.log(`[AI] Sending request to Google Gemini (gemini-1.5-flash)...`);

            const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
            // Use 'gemini-flash-latest' as confirmed by API discovery script
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest", generationConfig: { responseMimeType: "application/json" } });

            const result = await model.generateContent(prompt);
            content = result.response.text();

        } else {
            // Default: Groq
            if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
            console.log(`[AI] Sending request to Groq (${AI_MODEL})...`);

            const groq = new Groq({ apiKey: GROQ_API_KEY });
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You are a legal expert AI. You extract structured data from contracts. You output ONLY JSON.' },
                    { role: 'user', content: prompt }
                ],
                model: AI_MODEL,
                temperature: 0.1,
                response_format: { type: 'json_object' }
            });
            content = completion.choices[0]?.message?.content || '';
        }

        if (!content) throw new Error('Empty response from AI Provider');

        const refined = JSON.parse(content);
        return mergeData(regexData, refined);

    } catch (error: any) {
        console.warn(`[AI] Primary provider ${AI_PROVIDER} failed: ${error.message}`);

        // --- FALLBACK LOGIC ---
        // If Gemini failed, try Groq (if configured)
        if (AI_PROVIDER === 'gemini' && GROQ_API_KEY) {
            try {
                console.log(`[AI] REMEDY: Retrying with Fallback Provider (Groq / ${FALLBACK_MODEL})...`);
                const groq = new Groq({ apiKey: GROQ_API_KEY });

                // Use a smaller prompt context for the backup model to avoid 413
                const smallerPrompt = prompt.replace(truncatedText, truncatedText.substring(0, 10000));

                const completion = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: 'You are a legal expert AI. You extract structured data from contracts. You output ONLY JSON.' },
                        { role: 'user', content: smallerPrompt }
                    ],
                    model: FALLBACK_MODEL,
                    temperature: 0.1,
                    response_format: { type: 'json_object' }
                });

                const content = completion.choices[0]?.message?.content;
                if (!content) throw new Error('Empty response from Fallback');

                const refined = JSON.parse(content);
                return mergeData(regexData, refined);
            } catch (fallbackError: any) {
                console.error(`[AI] Fallback (Groq) also failed: ${fallbackError.message}`);
                // Don't throw here, just let it return the original error to fall back to Regex
            }
        }

        throw error;
    }
}

function mergeData(regexData: ExtractedMetadata, refined: any): ExtractedMetadata {
    return {
        ...regexData,
        parties: refined.parties || regexData.parties,
        signatureDate: refined.signatureDate || regexData.signatureDate,
        expiryDate: refined.expiryDate || regexData.expiryDate,
        value: refined.value || regexData.value,
        cancellationClauses: refined.cancellationClauses || regexData.cancellationClauses,
        summary: refined.summary || regexData.summary,
        extractionMethod: 'regex+ai'
    };
}

// ==========================================
// MAIN ENTRY POINT
// ==========================================
export async function extractContractMetadata(fileBuffer: Buffer, filename: string): Promise<ExtractedMetadata> {
    // 1. Extract Text
    const text = await extractTextFromPDF(fileBuffer);

    // 2. Regex Baseline
    const regexMetadata = extractMetadataRegex(text);
    regexMetadata.filename = filename;

    // 3. AI Refinement
    const hasKey = AI_PROVIDER === 'gemini' ? !!GOOGLE_API_KEY : !!GROQ_API_KEY;

    console.log(`[AI Config] Enabled: ${AI_ENABLED}`);
    console.log(`[AI Config] Provider: ${AI_PROVIDER}`);
    console.log(`[AI Config] Key Configured: ${hasKey}`);

    if (AI_ENABLED && hasKey) {
        // If text is empty (PDF parse failed), don't waste AI quota or cause hallucinations
        if (!text || text.trim().length < 50) {
            console.warn('[AI] Text too short or empty. Skipping AI.');
            return { ...regexMetadata, extractionMethod: 'regex', aiError: 'PDF ilegível (Texto vazio)' };
        }

        try {
            console.log(`[AI] Refining metadata with ${AI_PROVIDER === 'gemini' ? 'Gemini 1.5 Flash' : AI_MODEL}...`);
            const refined = await refineMetadata(text, regexMetadata);
            console.log('[AI] Refinement successful');
            return refined;
        } catch (error: any) {
            const errorMessage = error.message || 'Unknown error';
            console.warn('[AI] Refinement failed:', errorMessage);

            let friendlyError = 'Erro na IA';
            if (errorMessage.includes('401')) friendlyError = 'Chave Inválida (401)';
            if (errorMessage.includes('429')) friendlyError = 'Rate Limit Excedido';
            if (errorMessage.includes('413')) friendlyError = 'Arquivo Muito Grande';

            return {
                ...regexMetadata,
                extractionMethod: 'regex',
                aiError: friendlyError
            };
        }
    }

    const reason = !AI_ENABLED ? 'Disabled in env'
        : !hasKey ? `No API Key for ${AI_PROVIDER}`
            : 'Unknown trigger';

    console.log(`[AI] Using regex-only extraction (${reason})`);
    return { ...regexMetadata, extractionMethod: 'regex', aiError: reason };
}
