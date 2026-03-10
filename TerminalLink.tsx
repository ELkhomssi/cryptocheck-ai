
import React from 'react';
import Link from 'next/link';

export default function TerminalButton() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <Link href="/terminal">
        <button style={{
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          Launch CryptoCheck Terminal
        </button>
      </Link>
    </div>
  );
}
