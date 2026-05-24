'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

type Command = {
  id: number;
  trigger: string;
  payload: string;
  enabled: boolean;
  allowedScopes: string;
};

type ScopeValue = { dms: boolean; groups: boolean; groupIds: string[] };

const DEFAULT_SCOPES: ScopeValue = { dms: true, groups: true, groupIds: [] };

export default function CommandsPage() {
  const qc = useQueryClient();
  const { data: commands = [], isLoading } = useQuery<Command[]>({
    queryKey: ['commands'],
    queryFn: () => apiGet('/commands'),
  });

  const [form, setForm] = useState({ trigger: '', payload: '', dms: true, groups: true });
  const [editId, setEditId] = useState<number | null>(null);
  const [editPayload, setEditPayload] = useState('');
  const [editEnabled, setEditEnabled] = useState(true);

  const create = useMutation({
    mutationFn: () =>
      apiPost('/commands', {
        trigger: form.trigger,
        payload: form.payload,
        allowedScopes: JSON.stringify({ dms: form.dms, groups: form.groups, groupIds: [] }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commands'] });
      setForm({ trigger: '', payload: '', dms: true, groups: true });
    },
  });

  const update = useMutation({
    mutationFn: (id: number) =>
      apiPatch(`/commands/${id}`, { payload: editPayload, enabled: editEnabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commands'] });
      setEditId(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiDelete(`/commands/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commands'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Comandos</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="font-semibold mb-3">Novo comando</h2>
        <div className="flex flex-wrap gap-3">
          <input
            placeholder="trigger (ex: teste)"
            value={form.trigger}
            onChange={(e) => setForm({ ...form, trigger: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
          />
          <input
            placeholder="Resposta"
            value={form.payload}
            onChange={(e) => setForm({ ...form, payload: e.target.value })}
            className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
          />
          <label className="flex items-center gap-1 text-sm text-gray-400">
            <input type="checkbox" checked={form.dms} onChange={(e) => setForm({ ...form, dms: e.target.checked })} className="accent-green-500" />
            DMs
          </label>
          <label className="flex items-center gap-1 text-sm text-gray-400">
            <input type="checkbox" checked={form.groups} onChange={(e) => setForm({ ...form, groups: e.target.checked })} className="accent-green-500" />
            Grupos
          </label>
          <button
            onClick={() => create.mutate()}
            disabled={!form.trigger || !form.payload || create.isPending}
            className="bg-green-700 hover:bg-green-600 px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50 transition-colors"
          >
            Adicionar
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {isLoading ? (
          <p className="p-4 text-gray-500 text-sm">Carregando...</p>
        ) : commands.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">Nenhum comando cadastrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="p-3">Trigger</th>
                <th className="p-3">Resposta</th>
                <th className="p-3">Escopo</th>
                <th className="p-3">Ativo</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {commands.map((cmd) => {
                let scope: ScopeValue = DEFAULT_SCOPES;
                try { scope = JSON.parse(cmd.allowedScopes); } catch {}
                return (
                  <tr key={cmd.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 font-mono text-green-400">!{cmd.trigger}</td>
                    <td className="p-3">
                      {editId === cmd.id ? (
                        <input
                          value={editPayload}
                          onChange={(e) => setEditPayload(e.target.value)}
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 w-full focus:outline-none"
                        />
                      ) : (
                        cmd.payload
                      )}
                    </td>
                    <td className="p-3 text-xs text-gray-400">
                      {scope.dms && 'DMs '}
                      {scope.groups && 'Grupos'}
                    </td>
                    <td className="p-3">
                      {editId === cmd.id ? (
                        <input
                          type="checkbox"
                          checked={editEnabled}
                          onChange={(e) => setEditEnabled(e.target.checked)}
                          className="accent-green-500"
                        />
                      ) : (
                        <span className={cmd.enabled ? 'text-green-400' : 'text-red-400'}>
                          {cmd.enabled ? 'Sim' : 'Não'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 flex gap-2">
                      {editId === cmd.id ? (
                        <>
                          <button onClick={() => update.mutate(cmd.id)} className="text-green-400 hover:text-green-300 text-xs">Salvar</button>
                          <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-300 text-xs">Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditId(cmd.id); setEditPayload(cmd.payload); setEditEnabled(cmd.enabled); }}
                            className="text-blue-400 hover:text-blue-300 text-xs"
                          >
                            Editar
                          </button>
                          <button onClick={() => remove.mutate(cmd.id)} className="text-red-400 hover:text-red-300 text-xs">
                            Remover
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
