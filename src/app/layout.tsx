import type { Metadata } from "next";
import { Inter } from 'next/font/google';

import { getSession } from "~/auth"
import "~/app/globals.css";
import { Providers } from "~/app/providers";
import { APP_NAME, APP_DESCRIPTION } from "~/lib/constants";
import BottomNav from "~/components/BottomNav";

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        <Providers session={session}>
          <div className="pb-16">
            {children}
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
