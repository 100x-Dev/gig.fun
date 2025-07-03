import { AuthOptions, getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import { createAppClient, viemConnector } from "@farcaster/auth-client";

declare module "next-auth" {
  interface User {
    id: string;
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
    walletAddress?: string | null;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
    walletAddress?: string | null;
  }
}

function getDomainFromUrl(urlString: string | undefined): string {
  if (!urlString) {
    console.warn('NEXTAUTH_URL is not set, using localhost:3000 as fallback');
    return 'localhost:3000';
  }
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (error) {
    console.error('Invalid NEXTAUTH_URL:', urlString, error);
    console.warn('Using localhost:3000 as fallback');
    return 'localhost:3000';
  }
}

export const authOptions: AuthOptions = {
    // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      name: "Sign in with Farcaster",
      credentials: {
        // For the simplified sign-in flow, we accept user details directly.
        // In a production app, you should switch to a cryptographic flow.
        fid: { label: "FID", type: "text" },
        username: { label: "Username", type: "text" },
        pfpUrl: { label: "PFP URL", type: "text" },
        walletAddress: { label: "Wallet Address", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) {
          console.log('No credentials provided to authorize');
          return null;
        }
        
        // Type assertion for credentials
        const creds = credentials as {
          fid: string;
          username?: string;
          pfpUrl?: string;
          walletAddress?: string;
        };
        
        console.log('Authorize credentials received:', {
          fid: creds.fid,
          username: creds.username,
          hasPfpUrl: !!creds.pfpUrl,
          walletAddress: creds.walletAddress || 'Not provided'
        });
        
        if (creds.fid) {
          const user = {
            id: creds.fid,
            fid: Number(creds.fid),
            username: creds.username || `user-${creds.fid}`,
            displayName: creds.username || `User ${creds.fid}`,
            pfpUrl: creds.pfpUrl,
            walletAddress: creds.walletAddress || null,
          };
          
          console.log('Creating user session with:', {
            fid: user.fid,
            username: user.username,
            hasPfpUrl: !!user.pfpUrl,
            walletAddress: user.walletAddress || 'No wallet address'
          });
          
          return user;
        }
        
        console.log('No FID found in credentials, returning null');
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.fid = user.fid;
        token.username = user.username;
        token.displayName = user.displayName;
        token.pfpUrl = user.pfpUrl;
        token.walletAddress = user.walletAddress || null;
        console.log('JWT - Initial sign in with wallet address:', token.walletAddress);
      }
      
      // Update token with session data if triggered by update()
      if (trigger === 'update' && session) {
        // Type assertion to handle the session update
        const updatedSession = session as { user?: { walletAddress?: string | null } };
        if (updatedSession.user?.walletAddress !== undefined) {
          token.walletAddress = updatedSession.user.walletAddress;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Add custom properties to the session
      if (token) {
        session.user = {
          id: token.sub || '',
          fid: token.fid,
          username: token.username,
          displayName: token.displayName,
          pfpUrl: token.pfpUrl,
          walletAddress: token.walletAddress || null
        };
        console.log('Session - User data:', {
          id: session.user.id,
          fid: session.user.fid,
          walletAddress: session.user.walletAddress
        });
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "none",
        path: "/",
        secure: true
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true
      }
    }
  }
}

export const getSession = async () => {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}
