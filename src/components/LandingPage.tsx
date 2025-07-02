import Link from 'next/link';
import { Button } from '~/components/ui/button';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            <span className="block">Welcome to</span>
            <span className="block text-blue-600 dark:text-blue-400">Gig.Fun</span>
          </h1>
          
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Discover and offer services in the Farcaster ecosystem. Connect with talented individuals and get things done.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/services" className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                Browse Services
              </Button>
            </Link>
            <Link href="/services/new" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full">
                Create a Service
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Discover',
              description: 'Find the perfect service for your needs from our growing community of creators.',
              icon: '🔍',
            },
            {
              title: 'Create',
              description: 'Offer your skills and services to the Farcaster community.',
              icon: '✨',
            },
            {
              title: 'Connect',
              description: 'Work directly with other Farcaster users in a trustless environment.',
              icon: '🤝',
            },
          ].map((feature, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{feature.title}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
