import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const apiKey = process.env.NEYNAR_API_KEY;
  const { searchParams } = new URL(request.url);
  const fids = searchParams.get('fids');
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Neynar API key is not configured. Please add NEYNAR_API_KEY to your environment variables.' },
      { status: 500 }
    );
  }

  if (!fids) {
    return NextResponse.json(
      { error: 'FIDs parameter is required' },
      { status: 400 }
    );
  }

  try {
    const fidsArray = fids.split(',').map(fid => parseInt(fid.trim()));
    
    try {
      const neynar = new NeynarAPIClient({ apiKey });
      const { users } = await neynar.fetchBulkUsers({
        fids: fidsArray,
      });

      // If we got users from Neynar, return them
      if (users && users.length > 0) {
        return NextResponse.json({ users });
      }
    } catch (error) {
      console.warn('Neynar API request failed, returning basic user data:', error);
    }
    
    // If Neynar API fails or returns no users, return basic user data
    const users = fidsArray.map(fid => ({
      fid,
      username: `user${fid}`,
      displayName: `User ${fid}`,
      pfpUrl: null,
      profile: {
        bio: { text: '' },
      },
      followerCount: 0,
      followingCount: 0,
    }));
    
    return NextResponse.json({ users });
    
  } catch (error) {
    console.error('Unexpected error in users API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching user data.' },
      { status: 500 }
    );
  }
}
