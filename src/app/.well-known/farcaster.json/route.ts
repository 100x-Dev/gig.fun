import { NextResponse } from 'next/server';
import { getFarcasterMetadata } from '../../../lib/utils';

export const dynamic = 'force-dynamic';

// Hardcoded account association values from Warpcast Developer Tools
const ACCOUNT_ASSOCIATION = {
  header: 'eyJmaWQiOjEwMDgzNzgsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgxNDQwNEIxODlBMDQyNmJjN2NkMjg5NkYzODNiRDIwQTNiMzUwZDI2In0',
  payload: 'eyJkb21haW4iOiIwMTU0LTEwMy0yMTktNDctMjEyLm5ncm9rLWZyZWUuYXBwIn0',
  signature: 'MHhkNWM4OWRlNTNhZTBhYWU2MjkwMjNmNDczMmY1Zjg1MDdjN2JkODYwMDM1YjFhNDZiOWVkOWVkZGFiMjkzNTA5MDQ2Y2ZjZGE3NDIyYjhkZmMwMDdjY2ZhMmU0Mjg3ZmIwNDViYmRjYjViNWQ1ZWUwZGM0NzA1YTliNDIyNTNjZTFi'
};

export async function GET() {
  try {
    const manifest = await getFarcasterMetadata();
    
    // Add the account association to the manifest
    const manifestWithAccountAssociation = {
      ...manifest,
      accountAssociation: ACCOUNT_ASSOCIATION
    };
    
    return new NextResponse(JSON.stringify(manifestWithAccountAssociation, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error generating Farcaster manifest:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to generate Farcaster manifest',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Handle OPTIONS method for CORS preflight
// This is required for some Farcaster clients
// that send preflight requests
// This is a workaround for the fact that Next.js 13+ doesn't automatically
// handle OPTIONS for dynamic routes
// See: https://nextjs.org/docs/app/building-your-application/routing/router-handlers#cors
// and: https://github.com/vercel/next.js/discussions/40270
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
