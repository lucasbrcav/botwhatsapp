'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import Image from 'next/image';

type WahaStatus = { status: string; name: string };
type QRData = { value: string; imageBase64?: string };

export default function ConnectionPage() {
  const qc = useQueryClient();

  const { data: status, isLoading: statusLoading } = useQuery<WahaStatus>({
    queryKey: ['waha-status'],
    queryFn: () => apiGet('/waha/status'),
    refetchInterval: 10000,
  });

  const { data: qr } = useQuery<QRData>({
    queryKey: ['waha-qr'],
    queryFn: () => apiGet('/waha/qr'),
    enabled: status?.status !== 'WORKING',
    refetchInterval: 15000,
  });

  const restart = useMutation({
    mutationFn: () => apiPost('/waha/restart'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waha-status'] });
      qc.invalidateQueries({ queryKey: ['waha-qr'] });
    },
  });

  const isWorking = status?.status === 'WORKING';

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Conexão WhatsApp</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Status atual</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${isWorking ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            <span className="font-medium">{statusLoading ? 'Carregando...' : (status?.status || 'Desconhecido')}</span>
          </div>
        </div>
        <button
          onClick={() => restart.mutate()}
          disabled={restart.isPending}
          className="bg-gray-700 hover:bg-gray-600 text-sm px-3 py-2 rounded transition-colors disabled:opacity-50"
        >
          {restart.isPending ? 'Reiniciando...' : 'Reiniciar sessão'}
        </button>
      </div>

      {!isWorking && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-400 text-sm mb-4">Escaneie o QR Code com o WhatsApp</p>
          {qr?.imageBase64 ? (
            <div className="inline-block bg-white p-2 rounded">
              <img
                src={`data:image/png;base64,${qr.imageBase64}`}
                alt="QR Code WhatsApp"
                width={256}
                height={256}
                className="block"
              />
            </div>
          ) : (
            <div className="w-64 h-64 bg-gray-800 rounded mx-auto flex items-center justify-center">
              <span className="text-gray-500 text-sm">Aguardando QR Code...</span>
            </div>
          )}
        </div>
      )}

      {isWorking && (
        <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-green-300 text-center">
          WhatsApp conectado com sucesso!
        </div>
      )}
    </div>
  );
}
