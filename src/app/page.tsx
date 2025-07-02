import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "~/auth";
import { APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE_URL } from "~/lib/constants";
import { getMiniAppEmbedMetadata } from "~/lib/utils";
import { LandingPage } from "~/components/LandingPage";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [APP_OG_IMAGE_URL],
    },
    other: {
      "fc:frame": JSON.stringify(getMiniAppEmbedMetadata()),
    },
  };
}

export default async function Home() {
  // If you want to redirect authenticated users to /services
  // const session = await getServerSession(authOptions);
  // if (session?.user?.fid) {
  //   redirect('/services');
  // }
  
  return <LandingPage />;
}
