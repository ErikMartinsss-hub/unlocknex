import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import '@/app/globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from '@/components/Toaster';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'UnlockNex — Desbloqueios de celulares em minutos',
  description:
    'FRP, reparo de IMEI, remoção de MDM, desbloqueio de operadora e mais serviços de desbloqueio para técnicos.',
  openGraph: {
    title: 'UnlockNex',
    description: 'Desbloqueios de celulares em minutos.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={outfit.variable}>
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <AuthProvider>
          <Toaster>{children}</Toaster>
        </AuthProvider>
      </body>
    </html>
  );
}