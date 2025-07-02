import { useEffect, useState } from "react";

export interface NeynarUser {
  fid: number;
  score: number;
}

export function useNeynarUser(context?: { user?: { fid?: number } }) {
  const [user, setUser] = useState<NeynarUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!context?.user?.fid) {
      setUser(null);
      setError(null);
      return;
    }
    
    // Create a basic user object with just the FID
    const fallbackUser = {
      fid: context.user.fid,
      score: 0, // Default score
      username: `user${context.user.fid}`, // Fallback username
      displayName: `User ${context.user.fid}`, // Fallback display name
    };

    setLoading(true);
    setError(null);
    
    // Try to fetch from Neynar API, but fall back to basic user if it fails
    fetch(`/api/users?fids=${context.user.fid}`)
      .then((response) => {
        if (!response.ok) {
          console.warn('Neynar API request failed, using fallback user data');
          return { users: [fallbackUser] };
        }
        return response.json();
      })
      .then((data) => {
        // If we got users from the API, use them, otherwise use the fallback
        const userData = data.users?.[0] || fallbackUser;
        setUser({
          fid: userData.fid,
          score: userData.score || 0,
          // Include any additional fields you need
          ...userData,
        });
      })
      .catch((err) => {
        console.warn('Error fetching user from Neynar, using fallback:', err);
        setUser(fallbackUser);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [context?.user?.fid]);

  return { user, loading, error };
} 