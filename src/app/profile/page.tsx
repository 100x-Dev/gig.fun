'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/Avatar';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session?.user) {
    router.push('/login');
    return null;
  }

  const { user } = session;
  const username = user.username || `user-${user.fid?.toString().slice(0, 6)}`;
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-24"></div>
            <div className="px-6 pb-6 -mt-12">
              <div className="flex justify-center">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800">
                  <AvatarImage src={user.pfpUrl} alt={username} />
                  <AvatarFallback className="text-2xl font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="mt-4 text-center">
                <h1 className="text-2xl font-bold">{user.displayName || username}</h1>
                <p className="text-gray-500 dark:text-gray-400">@{username}</p>
                {user.walletAddress && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 truncate" title={user.walletAddress}>
                    {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                  </p>
                )}
              </div>
            </div>
            <div className="px-6 pb-6">
              <Button className="w-full" variant="outline">
                Edit Profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
