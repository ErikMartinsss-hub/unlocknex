'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/Toaster';
import { Logo } from '@/components/Logo';
import { Icon } from '@/components/Icon';
import { brl } from '@/lib/format';

const nav = [
  { href: '/dashboard', icon: 'home', name: 'Dashboard' },
  { href: '/pedidos/novo', icon: 'plus', name: 'Novo Pedido' },
  { href: '/servicos', icon: 'grid', name: 'Serviços' },
  { href: '/remote', icon: 'wrench', name: 'Aluguel de ferramentas' },
  { href: '/pedidos', icon: 'file', name: 'Pedidos' },
  { href: '/tickets', icon: 'chat', name: 'Tickets' },
  { href: '/perfil', icon: 'user', name: 'Perfil' },
];

export function AppShell({ children, header }: { children: React.ReactNode; header?: React.ReactNode }) {
  const { user, profile, logout } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      push('Você saiu da sua conta.', 'ok');
      router.replace('/login');
    } catch {
      push('Não foi possível sair no momento.', 'err');
    }
  };

  const isActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href));

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-800 bg-zinc-900/95 backdrop-blur transition-transform lg:static lg:z-auto lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center border-b border-zinc-800 px-5">
          <Logo size="h-10 w-10" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive(item.href)
                  ? 'bg-neon-500/10 text-neon-400 neon-glow-sm'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
              }`}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="space-y-3 border-t border-zinc-800 p-4">
          <div className="rounded-xl border border-neon-500/25 bg-neon-500/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Saldo disponível</p>
            <p className="mt-1 text-2xl font-extrabold text-neon-500">{brl(profile?.balance ?? 0)}</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-500 to-emerald-700 text-sm font-bold text-zinc-950">
              {profile?.name?.charAt(0)?.toUpperCase() ?? 'T'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-100">{profile?.name ?? user?.email}</p>
              <p className="truncate text-xs text-zinc-500">Técnico</p>
            </div>
            <Link href="/perfil" title="Perfil" className="inline-flex rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
              <Icon name="cog" className="h-5 w-5" />
            </Link>
            <button
              type="button"
              title="Sair"
              onClick={handleLogout}
              className="inline-flex rounded-lg p-2 text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <Icon name="logout" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="inline-flex rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 lg:hidden"
            >
              <Icon name="menu" className="h-6 w-6" />
            </button>
            <div className="hidden text-lg font-semibold text-zinc-100 sm:block">{header}</div>
            <div className="text-lg font-semibold text-zinc-100 sm:hidden">{header}</div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative inline-flex rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
              <Icon name="bell" className="h-5 w-5" />
              <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-neon-500" />
            </button>

            <div className="relative z-50">
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                className="inline-flex rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
              >
                <Icon name="chevronDown" className="h-4 w-4" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
                  <Link href="/perfil" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800">
                    Perfil
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800"
                  >
                    <Icon name="logout" className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              title="Sair"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-sm font-medium text-zinc-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
            >
              <Icon name="logout" className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}