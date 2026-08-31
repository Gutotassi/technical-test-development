'use client';

import { useEffect, useState } from 'react';

interface EmailLog {
  id: string;
  pedidoReferencia: string;
  destinatario: string;
  status: string;
  erroMensagem: string | null;
  tentativas: number;
  criadoEm: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function SuporteEmailsPage() {
  const [emailsComFalha, setEmailsComFalha] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const carregarFalhas = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const res = await fetch(`${API_BASE_URL}/admin/emails`);  
      if (!res.ok) throw new Error('Erro ao buscar logs de e-mail.');
      const data = await res.json();
      setEmailsComFalha(data);
    } catch (err: any) {
      setFeedback(`Erro ao carregar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarFalhas();
  }, []);

  const handleReenviar = async (id: string) => {
    try {
      setProcessingId(id);
      setFeedback(null);

      const res = await fetch(`${API_BASE_URL}/admin/emails/${id}/reenviar`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Falha ao processar o reenvio.');

      setFeedback('E-mail reenviado com sucesso!');
      setEmailsComFalha((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setFeedback(`Erro no reenvio: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Painel de Suporte — E-mails com Falha</h1>
            <p className="text-sm text-gray-500">Gestão operacional de reenvio de ingressos (Operador: João)</p>
          </div>
          <button
            onClick={carregarFalhas}
            className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded font-medium text-sm transition"
          >
            Atualizar Lista
          </button>
        </div>

        {feedback && (
          <div className={`p-4 mb-4 rounded text-sm ${feedback.includes('Erro') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {feedback}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando e-mails com falha...</div>
        ) : emailsComFalha.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded border border-dashed">
            Nenhum e-mail pendente com falha no momento. Tudo operando normalmente!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b text-xs uppercase text-gray-600 font-semibold">
                  <th className="py-3 px-4">Ref. Pedido</th>
                  <th className="py-3 px-4">Destinatário</th>
                  <th className="py-3 px-4">Erro Registrado</th>
                  <th className="py-3 px-4 text-center">Tentativas</th>
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {emailsComFalha.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{item.pedidoReferencia}</td>
                    <td className="py-3 px-4">{item.destinatario}</td>
                    <td className="py-3 px-4 text-red-600 max-w-xs truncate" title={item.erroMensagem || ''}>
                      {item.erroMensagem || 'Erro desconhecido'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-semibold">
                        {item.tentativas}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {new Date(item.criadoEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleReenviar(item.id)}
                        disabled={processingId === item.id}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded font-medium text-xs transition"
                      >
                        {processingId === item.id ? 'Reenviando...' : 'Reenviar E-mail'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}