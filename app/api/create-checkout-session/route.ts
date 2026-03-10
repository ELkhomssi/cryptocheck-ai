import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();
    
    // Simulation Stripe session
    const mockSession = {
      sessionId: `cs_test_${Math.random().toString(36).substr(2, 9)}`,
      url: `https://checkout.stripe.com/pay/test_session_${Date.now()}`,
      plan: plan || 'pro',
      price: plan === 'pro' ? 29 : 99,
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      data: mockSession
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Checkout failed' },
      { status: 500 }
    );
  }
}
