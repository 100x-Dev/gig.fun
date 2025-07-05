import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { mnemonicToAccount } from 'viem/accounts';
import { APP_BUTTON_TEXT, APP_DESCRIPTION, APP_ICON_URL, APP_NAME, APP_OG_IMAGE_URL, APP_PRIMARY_CATEGORY, APP_SPLASH_BACKGROUND_COLOR, APP_TAGS, APP_URL, APP_WEBHOOK_URL } from './constants';
import { APP_SPLASH_URL } from './constants';

interface MiniAppMetadata {
  version: string;
  name: string;
  iconUrl: string;
  homeUrl: string;
  splashImageUrl?: string;
  splashBackgroundColor?: string;
  webhookUrl?: string;
  subtitle?: string;
  description?: string;
  screenshotUrls?: string[];
  primaryCategory?: string;
  tags?: string[];
  heroImageUrl?: string;
  tagline?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  noindex?: boolean;
  requiredChains?: string[];
  requiredCapabilities?: string[];
  // Deprecated but kept for backward compatibility
  imageUrl?: string;
  buttonTitle?: string;
  accountAssociation?: {
    header: string;
    payload: string;
    signature: string;
  };
};

interface MiniAppManifest {
  accountAssociation?: {
    header: string;
    payload: string;
    signature: string;
  };
  miniapp: MiniAppMetadata;
  // Keep frame for backward compatibility
  frame?: MiniAppMetadata;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSecretEnvVars() {
  const seedPhrase = process.env.SEED_PHRASE;
  const fid = process.env.FID;
  
  if (!seedPhrase || !fid) {
    return null;
  }

  return { seedPhrase, fid };
}

export function getMiniAppEmbedMetadata(ogImageUrl?: string) {
  return {
    // Required fields
    version: "vNext",
    image: {
      url: ogImageUrl ?? APP_OG_IMAGE_URL,
      aspectRatio: "1.91:1"
    },
    
    // Frame metadata
    frame: {
      buttons: [
        {
          label: APP_BUTTON_TEXT || "Launch App",
          action: "post_redirect"
        }
      ],
      postUrl: `${APP_URL}/api/frame`,
      refreshPeriod: 60
    },
    
    // App metadata
    app: {
      id: APP_NAME.toLowerCase().replace(/\s+/g, '-'),
      name: APP_NAME,
      description: APP_DESCRIPTION,
      icon: APP_ICON_URL,
      splash: {
        imageUrl: APP_SPLASH_URL,
        backgroundColor: APP_SPLASH_BACKGROUND_COLOR || "#000000"
      },
      category: APP_PRIMARY_CATEGORY,
      tags: APP_TAGS,
      url: APP_URL,
      webhookUrl: APP_WEBHOOK_URL
    },
    
    // Additional metadata for better discovery
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [{
        url: ogImageUrl ?? APP_OG_IMAGE_URL,
        width: 1200,
        height: 630
      }]
    }
  };
}

export async function getFarcasterMetadata(): Promise<MiniAppManifest> {
  // Use process.env directly as this will be called from the server
  const env = process.env;
  
  // First check for MINI_APP_METADATA in .env and use that if it exists
  if (env.MINI_APP_METADATA) {
    try {
      const metadata = JSON.parse(env.MINI_APP_METADATA);
      console.log('Using pre-signed mini app metadata from environment');
      return metadata;
    } catch (error) {
      console.warn('Failed to parse MINI_APP_METADATA from environment:', error);
    }
  }

  const appUrl = env.NEXT_PUBLIC_URL;
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_URL not configured in environment variables');
  }
  console.log('Using app URL:', appUrl);

  // Get the domain from the URL (without https:// prefix)
  const domain = new URL(appUrl).hostname;
  console.log('Using domain for manifest:', domain);

  // Check for account association in environment variables
  let accountAssociation;
  
  // First try to get from environment variables
  if (process.env.FARCASTER_ACCOUNT_ASSOCIATION_HEADER &&
      process.env.FARCASTER_ACCOUNT_ASSOCIATION_PAYLOAD &&
      process.env.FARCASTER_ACCOUNT_ASSOCIATION_SIGNATURE) {
    
    accountAssociation = {
      header: process.env.FARCASTER_ACCOUNT_ASSOCIATION_HEADER,
      payload: process.env.FARCASTER_ACCOUNT_ASSOCIATION_PAYLOAD,
      signature: process.env.FARCASTER_ACCOUNT_ASSOCIATION_SIGNATURE
    };
    console.log('Using account association from environment variables');
  } 
  // Fallback to generating from seed phrase if available
  else {
    const secretEnvVars = getSecretEnvVars();
    if (secretEnvVars) {
      try {
        // Generate account from seed phrase
        const account = mnemonicToAccount(secretEnvVars.seedPhrase);
        const custodyAddress = account.address;

        const header = {
          fid: parseInt(secretEnvVars.fid),
          type: 'custody',
          key: custodyAddress,
        };
        const encodedHeader = Buffer.from(JSON.stringify(header), 'utf-8').toString('base64');

        const payload = { domain };
        const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');

        const signature = await account.signMessage({ 
          message: `${encodedHeader}.${encodedPayload}`
        });
        const encodedSignature = Buffer.from(signature, 'utf-8').toString('base64url');

        accountAssociation = {
          header: encodedHeader,
          payload: encodedPayload,
          signature: encodedSignature
        };
        console.log('Generated account association from seed phrase');
      } catch (error) {
        console.error('Failed to generate account association:', error);
      }
    }
  }

  if (!accountAssociation) {
    console.warn('No account association found -- domain verification will fail');
  }

  // Ensure all URLs use the correct ngrok domain and are properly formatted
  const ensureHttpsUrl = (path: string): string => {
    if (!path) return '';
    // Always use the ngrok domain for all URLs
    const ngrokDomain = '4b01-103-219-47-212.ngrok-free.app';
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `https://${ngrokDomain}/${cleanPath}`.replace(/\/+$/, '');
  };

  // Base URL using ngrok domain
  const baseUrl = 'https://4b01-103-219-47-212.ngrok-free.app';

  // Build the manifest object with properly formatted URLs
  const manifest: MiniAppManifest = {
    accountAssociation,
    miniapp: {
      version: '0.0.1',
      name: APP_NAME ?? "Neynar Starter Kit",
      iconUrl: ensureHttpsUrl('/icon.png'),
      homeUrl: baseUrl,
      splashImageUrl: ensureHttpsUrl('/splash.png'),
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
      webhookUrl: process.env.NEXT_PUBLIC_WEBHOOK_URL || ensureHttpsUrl('/api/webhook'),
      description: APP_DESCRIPTION,
      primaryCategory: APP_PRIMARY_CATEGORY,
      tags: APP_TAGS,
      // Optional but recommended
      ogTitle: APP_NAME,
      ogDescription: APP_DESCRIPTION,
      ogImageUrl: `${baseUrl}/api/opengraph-image`,
      // Keep deprecated fields for backward compatibility
      imageUrl: `${baseUrl}/api/opengraph-image`,
      buttonTitle: APP_BUTTON_TEXT ?? "Launch Mini App",
    }
  };

  // Add frame for backward compatibility
  manifest.frame = { ...manifest.miniapp };

  return manifest;
}
