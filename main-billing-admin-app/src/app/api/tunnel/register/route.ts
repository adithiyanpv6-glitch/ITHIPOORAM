import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

declare global {
  var __CLOUDFLARE_TUNNEL_URL__: string | undefined;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const DEFAULT_TUNNEL_URL = process.env.CLOUDFLARE_TUNNEL_URL || 'https://ghz-nursery-demonstrated-reputation.trycloudflare.com';

export async function GET() {
  const activeUrl = global.__CLOUDFLARE_TUNNEL_URL__ || DEFAULT_TUNNEL_URL;
  return NextResponse.json({ tunnelUrl: activeUrl }, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url } = body;
    if (url && typeof url === 'string') {
      const cleaned = url.trim().replace(/\/$/, '');
      global.__CLOUDFLARE_TUNNEL_URL__ = cleaned;
      return NextResponse.json({ success: true, tunnelUrl: cleaned }, { headers: corsHeaders });
    }
    return NextResponse.json({ error: 'Valid URL is required' }, { status: 400, headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
