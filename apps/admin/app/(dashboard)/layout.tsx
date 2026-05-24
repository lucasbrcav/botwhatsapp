'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/connection', label: 'Conexão QR' },
  { href: '/commands', label: 'Comandos' },
  { href: '/schedules', label: 'Horários' },
  { href: '/chats', label: 'Chats' },
  { href: '/logs', label: 'Logs' },
  { href: '/settings', label: 'Configurações' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await apiPost('/auth/logout');
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <span className="text-green-400 font-bold text-lg">WhatsBot</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block px-3 py-2 rounded text-sm transition-colors',
                pathname === item.href
                  ? 'bg-green-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-red-400 rounded hover:bg-gray-800 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
