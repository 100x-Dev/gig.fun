import '@neynar/react';

declare module '@neynar/react' {
  interface UserContext {
    custody_address?: string;
  }
}
