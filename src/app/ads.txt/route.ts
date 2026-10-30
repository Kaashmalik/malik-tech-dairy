// /ads.txt - authorised digital sellers (IAB). Generated from the AdSense publisher id
// so it can never drift from the id used in the ad tags.
import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || ''; // ca-pub-XXXXXXXXXXXXXXXX
  const publisherId = client.replace(/^ca-/, '');
  if (!/^pub-\d{10,20}$/.test(publisherId)) {
    return new NextResponse('Not found', { status: 404 });
  }
  // f08c47fec0942fa0 is Google's fixed certification authority id for AdSense
  return new NextResponse(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
