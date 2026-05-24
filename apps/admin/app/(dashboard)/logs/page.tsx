'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

type MessageLog = {
  id: number;
  direction: string;
  chatId: string;
  isGroup: boolean;
  from: string;
  body: string;
  createdAt: string;
  command?: { trigger: string } | null;
};

export default function LogsPage() {
  const [chatIdFilter, setChatIdFilter] = useState('');
  const [applied, setApplied] = useState('');

  const { data: logs = [], isLoading } = useQuery<MessageLog[]>({
    queryKey: ['logs', applied],
    queryFn: () =>
      apiGet(`/messages?limit=100${applied ? `&chatId=${encodeURIComponent(applied)}` : ''}`),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Logs de Mensagens</h1>

      <div className="flex gap-2">
        <input
          placeholder="Filtrar por chatId..."
          value={chatIdFilter}
          onChange={(e) => setChatIdFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500 w-72"
        />
        <button
          onClick={() => setApplied(chatIdFilter)}
          className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm transition-colors"
        >
          Filtrar
        </button>
        {applied && (
          <button
            onClick={() => { setChatIdFilter(''); setApplied(''); }}
            className="text-gray-400 hover:text-white text-sm px-2"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
        {isLoading ? (
          <p className="p-4 text-gray-500 text-sm">Carregando...</p>
        ) : logs.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">Nenhum log encontrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="p-3">Dir.</th>
                <th className="p-3">ChatId</th>
                <th className="p-3">De</th>
                <th className="p-3">Mensagem</th>
                <th className="p-3">Comando</th>
                <th className="p-3">Horário</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="p-3">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        log.direction === 'inbound'
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-green-900 text-green-300'
                      }`}
                    >
                      {log.direction === 'inbound' ? 'IN' : 'OUT'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-gray-400 max-w-[140px] truncate">{log.chatId}</td>
                  <td className="p-3 text-xs text-gray-400">{log.from}</td>
                  <td className="p-3 max-w-xs truncate">{log.body}</td>
                  <td className="p-3 text-xs text-green-400 font-mono">
                    {log.command ? `!${log.command.trigger}` : ''}
                  </td>
                  <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
