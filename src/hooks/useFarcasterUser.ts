import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
}

export function useFarcasterUser() {
  const { data: session } = useSession();
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!session?.user?.fid) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Basic user data from session
        const userData: FarcasterUser = {
          fid: session.user.fid,
          username: session.user.username || `user${session.user.fid}`,
          displayName: session.user.name || `User ${session.user.fid}`,
          pfpUrl: session.user.image || null,
        };

        setUser(userData);
        
        // Optional: Fetch additional data from Farcaster hubs if needed
        // This is where you could add hub queries if needed
        
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [session]);

  return { user, loading, error };
}
