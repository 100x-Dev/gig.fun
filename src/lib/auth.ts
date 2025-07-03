import { getServerSession as nextAuthGetServerSession } from "next-auth";
import { authOptions } from "~/auth";

export async function getServerSession() {
  try {
    const session = await nextAuthGetServerSession(authOptions);
    return session;
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}
