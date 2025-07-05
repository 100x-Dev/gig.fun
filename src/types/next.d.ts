import { NextPage } from 'next';

declare module 'next' {
  // Override the PageProps type to accept our params structure
  export interface PageProps {
    params?: Record<string, string>;
    searchParams?: Record<string, string | string[]>;
  }
}
