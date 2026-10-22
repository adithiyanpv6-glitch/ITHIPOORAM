import { NextResponse } from 'next/server';
import { pushLiveUpdateToGoogleWorkspace, getFullGoogleWorkspacePayload } from '@/lib/googleWorkspaceSync';
import { GOOGLE_WORKSPACE_CONFIG } from '@/config/googleWorkspace';

export async function GET() {
  try {
    const payload = getFullGoogleWorkspacePayload();
    return NextResponse.json({
      adminEmail: GOOGLE_WORKSPACE_CONFIG.adminEmail,
      configuredWebhook: Boolean(GOOGLE_WORKSPACE_CONFIG.webhookUrl),
      data: payload,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await pushLiveUpdateToGoogleWorkspace();
    return NextResponse.json({
      ...result,
      adminEmail: GOOGLE_WORKSPACE_CONFIG.adminEmail,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
