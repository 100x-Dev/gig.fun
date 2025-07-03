import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      fid: number;
      walletAddress: string;
    } & DefaultSession['user'];
  }

  interface User {
    walletAddress: string;
  }
}
