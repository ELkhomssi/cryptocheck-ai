import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { mintAddress } = await request.json();

    // Simulation du scanner AI (remplacez par votre vraie logique)
    const mockAnalysis = {
      mintAddress,
      score: Math.floor(Math.random() * 100),
      risk: Math.random() > 0.5 ? "SAFE" : "CAUTION",
      confidence: 94.7,
      scanTime: Math.floor(Math.random() * 500),
      factors: [
        { name: "Liquidity Check", status: "PASS" },
        { name: "Authority Analysis", status: "PASS" },
        { name: "Distribution Check", status: "WARN" }
      ]
    };

    return NextResponse.json({
      success: true,
      data: mockAnalysis
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Scan failed' },
      { status: 500 }
    );
  }
}
