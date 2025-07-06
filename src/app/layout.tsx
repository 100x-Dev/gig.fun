import type { Metadata } from "next";
import { Jua } from 'next/font/google';

import { getSession } from "~/auth"
import "~/app/globals.css";
import "~/app/theme.css";
import { Providers } from "~/app/providers";
import { APP_NAME, APP_DESCRIPTION } from "~/lib/constants";
import BottomNav from "~/components/BottomNav";
import { FarcasterFrameInitializer } from '~/components/FarcasterFrameInitializer';

const jua = Jua({ weight: '400', subsets: ['latin'] });

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {  
  const session = await getSession()

  return (
    <html lang="en">
      <body className={jua.className}>
        <Providers session={session}>
          <div className="pb-16">
            {children}
          </div>
          <BottomNav />
          <FarcasterFrameInitializer />
        </Providers>
      </body>
    </html>
  );
}
