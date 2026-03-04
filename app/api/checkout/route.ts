import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

export async function POST(req: NextRequest) {
  try {
    const { plan, method } = await req.json();
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (method === 'crypto') {
      const wallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET;
      const amount = plan === 'weekly' ? '5' : '200';
      return NextResponse.json({
        url: `https://jup.ag/swap/SOL-USDC?recipient=${wallet}&amount=${amount}`,
      });
    }

    const priceId = plan === 'weekly'
      ? process.env.STRIPE_PRICE_WEEKLY
      : process.env.STRIPE_PRICE_YEARLY;

    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/?upgraded=true`,
      cancel_url: `${APP_URL}/upgrade?cancelled=true`,
      metadata: { plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}