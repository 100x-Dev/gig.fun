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
      },
      async authorize(credentials) {
        // This is a simplified authorization flow for development.
        // It trusts the credentials sent from our SignIn component.
        if (credentials?.fid) {
          const fid = parseInt(credentials.fid, 10);
          return {
            id: fid.toString(),
            fid: fid,
            username: credentials.username,
            displayName: credentials.username,
            pfpUrl: credentials.pfpUrl,
          };
        }
        // If credentials are not valid, return null.
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.fid = user.fid;
        token.username = user.username;
        token.displayName = user.displayName;
        token.pfpUrl = user.pfpUrl;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user = {
          id: token.sub || '',
          fid: token.fid,
          username: token.username,
          displayName: token.displayName,
          pfpUrl: token.pfpUrl
        };
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
