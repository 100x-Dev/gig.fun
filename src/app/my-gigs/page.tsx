import { redirect } from 'next/navigation';

export default function MyGigsPage() {
  redirect('/gigs-purchased');
  return null;
}
