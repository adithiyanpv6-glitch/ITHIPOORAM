import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

const DEFAULT_TUNNEL_URL = process.env.CLOUDFLARE_TUNNEL_URL || 'https://admin-app-ithipooram.vercel.app';
const TUNNEL_FILE = path.join(process.cwd(), 'data', 'tunnel_url.txt');

export async function GET() {
  let activeUrl = global.__CLOUDFLARE_TUNNEL_URL__;
  if (!activeUrl && fs.existsSync(TUNNEL_FILE)) {
    try {
      const saved = fs.readFileSync(TUNNEL_FILE, 'utf8').trim();
      if (saved && saved.startsWith('http')) {
        activeUrl = saved;
        global.__CLOUDFLARE_TUNNEL_URL__ = saved;
      }
    } catch (e) {}
  }

  if (!activeUrl) {
    activeUrl = DEFAULT_TUNNEL_URL;
  }

  return NextResponse.json({ tunnelUrl: activeUrl }, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { url } = body;
    if (url && typeof url === 'string') {
      const cleaned = url.trim().replace(/\/$/, '');
      global.__CLOUDFLARE_TUNNEL_URL__ = cleaned;

      try {
        const dir = path.dirname(TUNNEL_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(TUNNEL_FILE, cleaned, 'utf8');
      } catch (e) {}

      return NextResponse.json({ success: true, tunnelUrl: cleaned }, { headers: corsHeaders });
    }
    return NextResponse.json({ error: 'Valid URL is required' }, { status: 400, headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
