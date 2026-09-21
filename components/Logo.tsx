import Link from 'next/link';
import Image from 'next/image';

export function Logo({ size = 'h-11 w-11' }: { size?: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className={`${size} relative overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-700/50`}>
        <Image src="/logo.jpeg" alt="UnlockNex" fill sizes="48px" className="object-contain" />
      </span>
      <span className="hidden text-lg font-extrabold tracking-tight text-zinc-100 sm:block">
        Unlock<span className="text-neon-500">Nex</span>
      </span>
    </Link>
  );
}