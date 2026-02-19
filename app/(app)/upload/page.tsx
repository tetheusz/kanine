'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const startChat = () => {
        if (result && result.rawText) {
            localStorage.setItem('chatContext', JSON.stringify({
                text: result.rawText,
                filename: result.filename,
                summary: result.summary
            }));
            router.push('/chat');
        }
    };

    async function handleUpload() {
        if (!file) return;

        setUploading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.status === 409) {
                const data = await res.json();
                setError(data.message);
                return;
            }

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || 'Upload failed');
            }

            const data = await res.json();
            setResult(data);
            setFile(null);
        } catch (err: any) {
            setError(err.message || 'Erro ao processar arquivo.');
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Upload de Contrato</h1>
                <p className="text-slate-600 mt-1">
                    Faça upload de um PDF. O sistema extrai automaticamente os metadados por regex.
                </p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div
                        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${file ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
                            }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const droppedFile = e.dataTransfer.files[0];
                            if (droppedFile && droppedFile.type === 'application/pdf') {
                                setFile(droppedFile);
                                setError(null);
                                setResult(null);
                            }
                        }}
                    >
                        {file ? (
                            <div>
                                <div className="text-5xl mb-4">📄</div>
                                <p className="text-lg font-semibold text-slate-900">{file.name}</p>
                                <p className="text-sm text-slate-600 mt-1">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <Button variant="outline" size="sm" className="mt-4" onClick={() => setFile(null)}>
                                    Remover
                                </Button>
                            </div>
                        ) : (
                            <div>
                                <div className="text-5xl mb-4">📁</div>
                                <p className="text-lg font-semibold text-slate-900 mb-2">
                                    Arraste um PDF aqui ou clique para selecionar
                                </p>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    id="file-input"
                                    onChange={(e) => {
                                        const selectedFile = e.target.files?.[0];
                                        if (selectedFile) {
                                            setFile(selectedFile);
                                            setError(null);
                                            setResult(null);
                                        }
                                    }}
                                />
                                <label htmlFor="file-input">
                                    <Button variant="outline" type="button" asChild>
                                        <span>Selecionar Arquivo</span>
                                    </Button>
                                </label>
                            </div>
                        )}
                    </div>

                    {file && (
                        <div className="mt-6 flex justify-end">
                            <Button onClick={handleUpload} disabled={uploading} size="lg">
                                {uploading ? 'Processando...' : '🚀 Processar Contrato'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-800">⚠️ {error}</p>
                    </CardContent>
                </Card>
            )}

            {result && (
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-blue-900 mb-4">✅ Contrato Processado</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-blue-700">Arquivo:</span>
                                    <p className="font-medium text-blue-900">{result.filename}</p>
                                </div>
                                <div>
                                    <span className="text-blue-700">Partes:</span>
                                    <p className="font-medium text-blue-900">{result.parties || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-blue-700">Assinatura:</span>
                                    <p className="font-medium text-blue-900">{result.signatureDate || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-blue-700">Vencimento:</span>
                                    <p className="font-medium text-blue-900">{result.expiryDate || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-blue-700">Valor:</span>
                                    <p className="font-medium text-blue-900">{result.value || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-blue-700">Método:</span>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-blue-900">
                                            {result.extractionMethod === 'regex+ai' ? 'IA + REGEX' : 'REGEX'}
                                        </p>
                                        {result.aiError && (
                                            <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full" title={result.aiError}>
                                                ⚠️ {result.aiError}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {result.aiError && result.aiError.includes('429') && (
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                                    <strong>Nota:</strong> A IA atingiu o limite de requisições (Rate Limit).
                                    O sistema usou o método REGEX automaticamente. Tente novamente em alguns instantes.
                                </div>
                            )}

                            <div className="mt-4">
                                <span className="text-blue-700">Resumo:</span>
                                <p className="text-blue-900 mt-1">{result.summary || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-6 justify-end">
                            <Button variant="outline" onClick={startChat}>
                                💬 Chat com Contrato
                            </Button>
                            {result.fileKey && (
                                <Button variant="outline" onClick={() => window.open(`/api/contracts/${result.id}/download`, '_blank')}>
                                    📥 Baixar PDF
                                </Button>
                            )}
                            <Button onClick={() => router.push('/dashboard')}>
                                Ver no Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
