'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';

type Chat = { id: string; name?: string; isGroup?: boolean };
type MessageLog = { id: number; direction: string; body: string; createdAt: string };

export default function ChatsPage() {
  const [selected, setSelected] = useState<Chat | null>(null);
  const [sendText, setSendText] = useState('');

  const { data: chats = [], isLoading } = useQuery<Chat[]>({
    queryKey: ['chats'],
    queryFn: () => apiGet('/waha/chats'),
  });

  const { data: logs = [] } = useQuery<MessageLog[]>({
    queryKey: ['chat-logs', selected?.id],
    queryFn: () => apiGet(`/messages?chatId=${encodeURIComponent(selected!.id)}&limit=50`),
    enabled: !!selected,
  });

  const send = useMutation({
    mutationFn: () => apiPost('/send', { chatId: selected!.id, text: sendText }),
    onSuccess: () => setSendText(''),
  });

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      <div className="w-64 bg-gray-900 border border-gray-800 rounded-lg overflow-y-auto">
        <div className="p-3 border-b border-gray-800 text-sm font-medium">Chats</div>
        {isLoading ? (
          <p className="p-3 text-gray-500 text-sm">Carregando...</p>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelected(chat)}
              className={`w-full text-left p-3 text-sm border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                selected?.id === chat.id ? 'bg-gray-800' : ''
              }`}
            >
              <div className="font-medium truncate">{chat.name || chat.id}</div>
              <div className="text-xs text-gray-500 truncate font-mono">{chat.id}</div>
            </button>
          ))
        )}
      </div>

      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Selecione um chat para ver as mensagens
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-gray-800 text-sm font-medium">
              {selected.name || selected.id}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`max-w-sm px-3 py-2 rounded-lg text-sm ${
                    log.direction === 'outbound'
                      ? 'ml-auto bg-green-900 text-green-100'
                      : 'bg-gray-800 text-gray-200'
                  }`}
                >
                  <p>{log.body}</p>
                  <p className="text-xs opacity-50 mt-1">
                    {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-800 flex gap-2">
              <input
                value={sendText}
                onChange={(e) => setSendText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendText && send.mutate()}
                placeholder="Digite uma mensagem..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
              <button
                onClick={() => send.mutate()}
                disabled={!sendText || send.isPending}
                className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
