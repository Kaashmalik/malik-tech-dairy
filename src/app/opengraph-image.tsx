import { ImageResponse } from 'next/og';

export const alt =
  'MTK Dairy - #1 Smart Dairy Farm Management Software Pakistan | ڈیری فارم مینجمنٹ';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 128,
        background: 'linear-gradient(135deg, #1F7A3D 0%, #155a2d 50%, #0f4a23 100%)',
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
      <div style={{ position: 'absolute', top: 40, left: 40, fontSize: 24, opacity: 0.9 }}>
        🐄 MTK Dairy
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
      <div style={{ fontSize: 72, marginBottom: 10 }}>🐄</div>
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
          color: '#1F7A3D',
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
