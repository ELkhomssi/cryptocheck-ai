import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId } = await request.json();
    
    // Simulation (remplacez par vraie intégration Stripe)
    return NextResponse.json({
      sessionId: "cs_test_" + Math.random().toString(36).substr(2, 9),
      url: `https://checkout.stripe.com/pay/test_session_${Date.now()}`
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 500 }
    );
  }
}
