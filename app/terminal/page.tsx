"use client";

export default function TerminalPage() {
  return (
    <div style={{ background: "#06060f", color: "#e2e8f0", minHeight: "100vh", padding: 20 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1>CryptoCheck AI Terminal</h1>
        <div style={{ background: "#111128", padding: 20, borderRadius: 8, fontFamily: "monospace" }}>
          <div style={{ color: "#7c3aed" }}>
            {"> Initializing blockchain audit..."}<br/>
            {"> Connection to Solana Mainnet: SUCCESS"}<br/>
            {"> Loading Alpha Feed..."}
          </div>
        </div>
      </div>
    </div>
  );
}
