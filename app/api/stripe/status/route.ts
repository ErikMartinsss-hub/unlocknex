import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  const mode = key.startsWith('sk_live_') || key.startsWith('rk_live_')
    ? 'live'
    : key.startsWith('sk_test_') || key.startsWith('rk_test_')
      ? 'test'
      : 'not-set';

  return NextResponse.json({
    ok: true,
    env: {
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      SITE_URL: !!process.env.SITE_URL,
    },
    mode,
  });
}