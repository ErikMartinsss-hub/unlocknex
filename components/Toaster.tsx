'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';

type Toast = { id: number; kind: 'ok' | 'err' | 'info'; message: string };
type ToastCtx = { push: (message: string, kind?: Toast['kind']) => void };

const Ctx = createContext<ToastCtx>({ push: () => {} });

export function useToast() {
  return useContext(Ctx);
}

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, kind: Toast['kind'] = 'info') => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-xl ${
              t.kind === 'ok'
                ? 'border-neon-500/40 bg-zinc-900 text-neon-300'
                : t.kind === 'err'
                  ? 'border-red-500/40 bg-zinc-900 text-red-300'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-200'
            }`}
          >
            <Icon
              name={t.kind === 'ok' ? 'check' : t.kind === 'err' ? 'alert' : 'info'}
              className={`mt-0.5 h-4 w-4 shrink-0 ${t.kind === 'err' ? 'text-red-400' : t.kind === 'ok' ? 'text-neon-400' : 'text-zinc-400'}`}
            />
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}