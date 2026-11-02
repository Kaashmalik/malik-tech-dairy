import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

export const alt =
  'MTK Dairy - #1 Smart Dairy Farm Management Software Pakistan | ڈیری فارم مینجمنٹ';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  const logoSvg = await readFile(path.join(process.cwd(), 'public/brand/logo-mark.svg'));
  const logoSrc = `data:image/svg+xml;base64,${logoSvg.toString('base64')}`;

  return new ImageResponse(
    <div
      style={{
        fontSize: 128,
        background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064E3B 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'system-ui',
        position: 'relative',
      }}
    >
      {/* Decorative elements */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 26,
          fontWeight: 'bold',
        }}
      >
        <img src={logoSrc} width={48} height={48} alt='' />
        MTK Dairy
      </div>
      <div
        style={{
          position: 'absolute',
          top: 40,
          right: 40,
          fontSize: 18,
          opacity: 0.8,
          background: 'rgba(255,255,255,0.2)',
          padding: '8px 16px',
          borderRadius: 20,
        }}
      >
        #1 in Pakistan
      </div>

      {/* Main content */}
      <img
        src={logoSrc}
        width={120}
        height={120}
        alt=''
        style={{ marginBottom: 20, borderRadius: 28, boxShadow: '0 12px 32px rgba(0,0,0,0.25)' }}
      />
      <div style={{ fontSize: 56, fontWeight: 'bold', textAlign: 'center', lineHeight: 1.2 }}>
        Smart Dairy Farm
      </div>
      <div style={{ fontSize: 56, fontWeight: 'bold', textAlign: 'center', lineHeight: 1.2 }}>
        Management Software
      </div>
      <div style={{ fontSize: 28, marginTop: 20, opacity: 0.95, textAlign: 'center' }}>
        Track Milk Production • Manage Cattle Health • Breeding Records
      </div>
      <div style={{ fontSize: 22, marginTop: 16, opacity: 0.8 }}>
        ڈیری فارم مینجمنٹ سافٹ ویئر پاکستان
      </div>

      {/* CTA */}
      <div
        style={{
          marginTop: 30,
          background: 'white',
          color: '#047857',
          padding: '12px 32px',
          borderRadius: 30,
          fontSize: 22,
          fontWeight: 'bold',
        }}
      >
        Start Free Trial →
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 8,
          background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)',
        }}
      />
    </div>,
    {
      ...size,
    }
  );
}
