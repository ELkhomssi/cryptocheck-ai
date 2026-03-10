import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { mintAddress } = await request.json();
    
    // Simulation réaliste d'un scan AI
    await new Promise(resolve => setTimeout(resolve, 500)); // Délai réaliste
    
    const mockScan = {
      mintAddress,
      score: Math.floor(Math.random() * 100),
      risk: Math.random() > 0.5 ? "SAFE" : "CAUTION",
      confidence: (90 + Math.random() * 9).toFixed(1),
      scanTime: Math.floor(Math.random() * 300) + 50,
      timestamp: Date.now(),
      analysis: {
        liquidity: { status: "PASS", value: "$1.2M" },
        authority: { status: Math.random() > 0.3 ? "PASS" : "WARN", value: "Renounced" },
        distribution: { status: "PASS", value: "Fair launch" },
        volume: { status: "PASS", value: "$450K (24h)" }
      }
    };

    return NextResponse.json({
      success: true,
      data: mockScan
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Scan failed' },
      { status: 500 }
    );
  }
}
