import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { mintAddress } = await request.json();
    
    const mockScan = {
      mintAddress,
      score: Math.floor(Math.random() * 100),
      risk: Math.random() > 0.5 ? "SAFE" : "CAUTION",
      confidence: (90 + Math.random() * 9).toFixed(1),
      scanTime: Math.floor(Math.random() * 300) + 50,
      analysis: {
        liquidity: { status: "PASS", value: "$1.2M" },
        authority: { status: "PASS", value: "Renounced" },
        distribution: { status: "PASS", value: "Fair launch" }
      }
    };

    return NextResponse.json({ success: true, data: mockScan });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Scan failed' }, { status: 500 });
  }
}
