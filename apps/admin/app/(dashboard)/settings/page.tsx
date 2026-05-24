'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';

type Settings = { commandPrefix: string; defaultTimezone: string; botEnabled: boolean };

export default function SettingsPage() {
  const { data, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: () => apiGet('/settings'),
  });

  const [form, setForm] = useState({ commandPrefix: '!', defaultTimezone: 'America/Sao_Paulo' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm({ commandPrefix: data.commandPrefix, defaultTimezone: data.defaultTimezone });
  }, [data]);

  const update = useMutation({
    mutationFn: () => apiPatch('/settings', form),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading) return <p className="text-gray-500 text-sm">Carregando...</p>;

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Prefixo de comando</label>
          <input
            value={form.commandPrefix}
            onChange={(e) => setForm({ ...form, commandPrefix: e.target.value })}
            maxLength={3}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500 w-24 font-mono"
          />
          <p className="text-xs text-gray-500 mt-1">Caractere que precede comandos (ex: !)</p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Timezone padrão</label>
          <input
            value={form.defaultTimezone}
            onChange={(e) => setForm({ ...form, defaultTimezone: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500 w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Ex: America/Sao_Paulo, America/Manaus</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => update.mutate()}
            disabled={update.isPending}
            className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {update.isPending ? 'Salvando...' : 'Salvar'}
          </button>
          {saved && <span className="text-green-400 text-sm">Salvo!</span>}
        </div>
      </div>
    </div>
  );
}
