import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const INDEXNOW_API_KEY = process.env.INDEXNOW_API_KEY || 'mtkdairy2026indexnowkey';
const HOST = 'dairy.mtkcodex.site';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const urlsToSubmit =
      body.urls && Array.isArray(body.urls) && body.urls.length > 0
        ? body.urls
        : [
            `https://${HOST}/`,
            `https://${HOST}/features`,
            `https://${HOST}/pricing`,
            `https://${HOST}/about`,
            `https://${HOST}/contact`,
            `https://${HOST}/faq`,
            `https://${HOST}/privacy-policy`,
            `https://${HOST}/terms-of-service`,
            `https://${HOST}/apply`,
          ];

    const payload = {
      host: HOST,
      key: INDEXNOW_API_KEY,
      keyLocation: `https://${HOST}/${INDEXNOW_API_KEY}.txt`,
      urlList: urlsToSubmit,
    };

    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      success: response.status === 200 || response.status === 202,
      status: response.status,
      submittedUrls: urlsToSubmit.length,
      message: 'IndexNow instant crawl signal dispatched',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit IndexNow request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    host: HOST,
    indexNowEndpoint: 'https://api.indexnow.org/indexnow',
    instructions: 'Send POST request to trigger instant indexing of URLs with search engines.',
  });
}
