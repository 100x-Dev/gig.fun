import { redirect } from 'next/navigation';

export default function PaidGigsRedirect() {
  redirect('/gigs-purchased');
  return null;
}
