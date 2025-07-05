import Link from 'next/link';
import { Button } from '~/components/ui/Button';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Soft Wave Background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-full">
            <path fill="#3C219A" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="text-center">
            <h1 className="font-jua text-5xl md:text-7xl tracking-tight text-[#3C219A] mb-6">
              <span className="block">welcome to</span>
              <span className="block">gig.fun</span>
            </h1>
            
            <p className="mt-6 max-w-md mx-auto text-lg md:text-xl text-gray-600 md:max-w-3xl">
              discover and offer services in the farcaster ecosystem. connect with talented individuals and get things done.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-5">
              <Link href="/services" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 rounded-full bg-[#3C219A] text-white font-medium text-lg hover:bg-[#5C41BA] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#3C219A]/20">
                  browse services
                </button>
              </Link>
              <Link href="/services/new" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 rounded-full bg-white text-[#3C219A] border-2 border-[#3C219A] font-medium text-lg hover:bg-[#3C219A] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-[#3C219A]/20">
                  create a service
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'discover',
              description: 'find the perfect service for your needs from our growing community of creators.',
              icon: '🔍',
            },
            {
              title: 'create',
              description: 'offer your skills and services to the farcaster community.',
              icon: '✨',
            },
            {
              title: 'connect',
              description: 'work directly with other farcaster users in a trustless environment.',
              icon: '🤝',
            },
          ].map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl hover:shadow-[#3C219A]/10 transition-all duration-300">
              <div className="text-4xl mb-6 bg-[#3C219A]/10 w-16 h-16 flex items-center justify-center rounded-2xl">{feature.icon}</div>
              <h3 className="text-xl font-jua text-[#3C219A] mb-4">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-[#3C219A]/5 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-jua text-3xl md:text-4xl text-[#3C219A] mb-6">ready to get started?</h2>
          <p className="text-lg text-gray-600 mb-10">join the community and start offering or discovering services today.</p>
          <Link href="/services">
            <button className="px-8 py-4 rounded-full bg-[#3C219A] text-white font-medium text-lg hover:bg-[#5C41BA] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#3C219A]/20">
              explore gig.fun
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
