const manifestData = {
  frame: {
    name: "gigs.fun",
    version: "1",
    iconUrl: "https://gigsfun.vercel.app/icon.png",
    homeUrl: "https://gigsfun.vercel.app",
    imageUrl: "https://gigsfun.vercel.app/image.png",
    splashImageUrl: "https://gigsfun.vercel.app/splash.png",
    splashBackgroundColor: "#6200EA",
    webhookUrl: "https://gigsfun.vercel.app/api/webhook",
    subtitle: "Connect and get gigs done",
    description: "Connect and get gigs done",
    primaryCategory: "utility"
  },
  accountAssociation: {
    header: "eyJmaWQiOjEwMDgzNzgsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhiODVCM2JiQjkzRmZENUE4YzIwQmU0MURkQ0VFQWYxNGMyZWMzNjYyIn0",
    payload: "eyJkb21haW4iOiJnaWdzZnVuLnZlcmNlbC5hcHAifQ",
    signature: "m8nvW+sqLwbjFGVYPgSH/b55d2Lq/r+HxD9F6y9ZSToBrLaW2QMOGINz1N7I6NMBoELE8/hBafZg3NqAzD1IcBw="
  }
};

export const manifest = manifestData;
export default manifestData;
