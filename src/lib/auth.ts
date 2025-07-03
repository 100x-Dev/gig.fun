import { auth } from "~/auth";

export async function getServerSession() {
  try {
    const session = await auth();
    return session;
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}
