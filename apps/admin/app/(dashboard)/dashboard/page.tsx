'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '@/lib/api';

type Settings = { botEnabled: boolean; commandPrefix: string; defaultTimezone: string };
type WahaStatus = { status: string; name: string };
type MessageLog = { id: number; direction: string; chatId: string; body: string; createdAt: string };

export default function DashboardPage() {
  const qc = useQueryClient();

  const { data: settings } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: () => apiGet('/settings'),
  });

  const { data: status } = useQuery<WahaStatus>({
    queryKey: ['waha-status'],
    queryFn: () => apiGet('/waha/status'),
    refetchInterval: 15000,
  });

  const { data: logs } = useQuery<MessageLog[]>({
    queryKey: ['logs'],
    queryFn: () => apiGet('/messages?limit=20'),
  });

  const toggleBot = useMutation({
    mutationFn: (val: boolean) => apiPatch('/settings', { botEnabled: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });

  const isWorking = status?.status === 'WORKING';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Status WAHA</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isWorking ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="font-medium">{status?.status || 'Carregando...'}</span>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Bot</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleBot.mutate(!settings?.botEnabled)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                settings?.botEnabled ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  settings?.botEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-sm">{settings?.botEnabled ? 'Ligado' : 'Desligado'}</span>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Prefixo de comando</p>
          <span className="font-mono text-xl text-green-400">{settings?.commandPrefix || '!'}</span>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="font-semibold mb-3">Últimas mensagens</h2>
        {logs && logs.length > 0 ? (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 text-sm border-b border-gray-800 pb-2">
                <span className={`font-mono text-xs px-1 rounded ${log.direction === 'inbound' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'}`}>
                  {log.direction === 'inbound' ? 'IN' : 'OUT'}
                </span>
                <span className="text-gray-400 truncate flex-1">{log.chatId}</span>
                <span className="text-gray-300 truncate max-w-xs">{log.body}</span>
                <span className="text-gray-600 text-xs whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Nenhuma mensagem ainda.</p>
        )}
      </div>
    </div>
  );
}
