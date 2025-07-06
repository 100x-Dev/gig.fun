import Link from 'next/link';
import { Button } from '~/components/ui/Button';

export function LandingPage() {
  return (
    <div className="h-screen overflow-hidden bg-white flex flex-col">
      {/* Hero Section with Wave Background - Only Visible Section */}
      <div className="relative flex-1 flex flex-col">
        {/* Wave Background */}
        <div className="absolute bottom-0 left-0 right-0 z-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
            <path fill="#3C219A" fillOpacity="0.1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-md mx-auto">
            <h1 className="font-jua text-5xl md:text-7xl tracking-tight text-[#3C219A] mb-6">
              <span className="block">welcome to</span>
              <span className="block">gig.fun</span>
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-gray-600">
              discover and offer services in the farcaster ecosystem. connect with talented individuals and get things done.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-5">
              <Link href="/services" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 rounded-full bg-[#3C219A] text-white font-medium text-lg hover:bg-[#5C41BA] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#3C219A]/20">
                  browse gigs
                </button>
              </Link>
              <Link href="/services/new" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 rounded-full bg-white text-[#3C219A] border-2 border-[#3C219A] font-medium text-lg hover:bg-[#3C219A] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-[#3C219A]/20">
                  create a gig
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
