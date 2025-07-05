import { NextResponse } from 'next/server';
import { getFarcasterMetadata } from '../../../lib/utils';

export const dynamic = 'force-dynamic';

// Account association values for Farcaster verification
const ACCOUNT_ASSOCIATION = {
  header: 'eyJmaWQiOjEwMDgzNzgsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhiODVCM2JiQjkzRmZENUE4YzIwQmU0MURkQ0VFQWYxNGMyZWMzNjYyIn0',
  payload: 'eyJkb21haW4iOiI0YjAxLTEwMy0yMTktNDctMjEyLm5ncm9rLWZyZWUuYXBwIn0',
  signature: 'wyQtRk5Meq/84L519S/wFxAR13e1q3cPUF62IkSZQMNnARmE4oKJLeuyysiteqKjt38aUNDOCdPzeyrL+plnPRw='
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
