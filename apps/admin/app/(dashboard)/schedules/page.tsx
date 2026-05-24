'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

type ScheduleProfile = {
  id: number;
  name: string;
  timezone: string;
  ranges: string;
  message: string;
  enabled: boolean;
  appliesToDms: boolean;
  allowedGroupIds: string;
  cooldownSeconds: number;
};

const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const emptyForm = {
  name: '',
  timezone: 'America/Sao_Paulo',
  message: '',
  appliesToDms: false,
  allowedGroupIds: '',
  cooldownSeconds: 3600,
  dow: 0,
  startHHmm: '22:00',
  endHHmm: '07:00',
};

export default function SchedulesPage() {
  const qc = useQueryClient();
  const { data: profiles = [], isLoading } = useQuery<ScheduleProfile[]>({
    queryKey: ['schedules'],
    queryFn: () => apiGet('/schedules'),
  });

  const [form, setForm] = useState(emptyForm);

  const create = useMutation({
    mutationFn: () => {
      const groupIds = form.allowedGroupIds
        ? form.allowedGroupIds.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      return apiPost('/schedules', {
        name: form.name,
        timezone: form.timezone,
        message: form.message,
        appliesToDms: form.appliesToDms,
        allowedGroupIds: JSON.stringify(groupIds),
        cooldownSeconds: Number(form.cooldownSeconds),
        ranges: JSON.stringify([{ dow: Number(form.dow), startHHmm: form.startHHmm, endHHmm: form.endHHmm }]),
        enabled: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] });
      setForm(emptyForm);
    },
  });

  const toggleEnabled = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      apiPatch(`/schedules/${id}`, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiDelete(`/schedules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Perfis de Horário</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Novo perfil</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Nome (ex: Noite)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
          />
          <input
            placeholder="Timezone (ex: America/Sao_Paulo)"
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
          />
          <textarea
            placeholder="Mensagem automática"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={2}
            className="col-span-2 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500 resize-none"
          />
          <div className="flex gap-3 items-center">
            <label className="text-sm text-gray-400">Dia:</label>
            <select
              value={form.dow}
              onChange={(e) => setForm({ ...form, dow: Number(e.target.value) })}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none"
            >
              {DOW.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <input
              type="time"
              value={form.startHHmm}
              onChange={(e) => setForm({ ...form, startHHmm: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none"
            />
            <span className="text-gray-400 text-sm">até</span>
            <input
              type="time"
              value={form.endHHmm}
              onChange={(e) => setForm({ ...form, endHHmm: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none"
            />
          </div>
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-1 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={form.appliesToDms}
                onChange={(e) => setForm({ ...form, appliesToDms: e.target.checked })}
                className="accent-green-500"
              />
              Aplicar em DMs
            </label>
            <input
              placeholder="IDs de grupos (vírgula)"
              value={form.allowedGroupIds}
              onChange={(e) => setForm({ ...form, allowedGroupIds: e.target.value })}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Cooldown (s):</label>
            <input
              type="number"
              value={form.cooldownSeconds}
              onChange={(e) => setForm({ ...form, cooldownSeconds: Number(e.target.value) })}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none"
            />
          </div>
        </div>
        <button
          onClick={() => create.mutate()}
          disabled={!form.name || !form.message || create.isPending}
          className="bg-green-700 hover:bg-green-600 px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50 transition-colors"
        >
          Criar perfil
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-gray-500 text-sm">Carregando...</p>
        ) : profiles.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum perfil cadastrado.</p>
        ) : (
          profiles.map((p) => {
            let ranges: any[] = [];
            try { ranges = JSON.parse(p.ranges); } catch {}
            let groupIds: string[] = [];
            try { groupIds = JSON.parse(p.allowedGroupIds); } catch {}
            return (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${p.enabled ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                      {p.enabled ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleEnabled.mutate({ id: p.id, enabled: !p.enabled })}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      {p.enabled ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => remove.mutate(p.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remover
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-2">"{p.message}"</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  <span>Timezone: {p.timezone}</span>
                  {ranges.map((r, i) => (
                    <span key={i}>{DOW[r.dow]}: {r.startHHmm}–{r.endHHmm}</span>
                  ))}
                  {p.appliesToDms && <span>DMs</span>}
                  {groupIds.length > 0 && <span>Grupos: {groupIds.join(', ')}</span>}
                  <span>Cooldown: {p.cooldownSeconds}s</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
