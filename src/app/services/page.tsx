"use client"
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/auth';
import { Button } from '~/components/ui/Button';
import ServiceCard from '~/components/ServiceCard';
import { Service } from '~/types/service';
import { useMiniApp } from '@neynar/react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// This is a temporary function to fetch services
// In a real app, you would fetch from your API
async function getServices(): Promise<Service[]> {
  try {
    // In a real app, fetch from your API
    // const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/services`);
    // return await res.json();

    // Return multiple mock services
    const now = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    return [
      {
        id: '1',
        fid: 123,
        title: 'Smart Contract Development',
        description: 'I\'ll build a secure and gas-optimized smart contract for your project. Specializing in Solidity and Hardhat.',
        price: 1500,
        currency: 'USDC',
        deliveryDays: 14,
        category: 'Development',
        tags: ['solidity', 'ethereum', 'smart-contracts'],
        status: 'active',
        createdAt: new Date(now.getTime() - 7 * oneDayInMs),
        updatedAt: new Date(now.getTime() - 2 * oneDayInMs)
      },
      {
        id: '2',
        fid: 456,
        title: 'UI/UX Design for Web3 Apps',
        description: 'Professional UI/UX design services tailored for web3 applications. I create intuitive interfaces that enhance user experience.',
        price: 1200,
        currency: 'USDC',
        deliveryDays: 10,
        category: 'Design',
        tags: ['ui-ux', 'web3', 'figma'],
        status: 'active',
        createdAt: new Date(now.getTime() - 5 * oneDayInMs),
        updatedAt: new Date(now.getTime() - 1 * oneDayInMs)
      },
      {
        id: '3',
        fid: 789,
        title: 'Full Stack Web3 Development',
        description: 'End-to-end web3 development including frontend, backend, and smart contract integration. Let\'s build something amazing!',
        price: 3000,
        currency: 'USDC',
        deliveryDays: 21,
        category: 'Development',
        tags: ['react', 'nextjs', 'ethers', 'hardhat'],
        status: 'active',
        createdAt: new Date(now.getTime() - 14 * oneDayInMs),
        updatedAt: new Date(now.getTime() - 3 * oneDayInMs)
      },
      {
        id: '4',
        fid: 101,
        title: 'Smart Contract Audit',
        description: 'Comprehensive security audit for your smart contracts. I\'ll identify vulnerabilities and suggest improvements.',
        price: 2500,
        currency: 'USDC',
        deliveryDays: 7,
        category: 'Security',
        tags: ['audit', 'security', 'solidity'],
        status: 'active',
        createdAt: new Date(now.getTime() - 3 * oneDayInMs),
        updatedAt: new Date(now.getTime() - 1 * oneDayInMs)
      },
      {
        id: '5',
        fid: 202,
        title: 'NFT Art Creation',
        description: 'Custom NFT art creation for your collection. Unique, high-quality designs that stand out in the market.',
        price: 800,
        currency: 'ETH',
        deliveryDays: 5,
        category: 'Art',
        tags: ['nft', 'art', 'digital-art'],
        status: 'active',
        createdAt: new Date(now.getTime() - 2 * oneDayInMs),
        updatedAt: new Date(now.getTime() - 1 * oneDayInMs)
      },
      {
        id: '6',
        fid: 303,
        title: 'DeFi Strategy Consultation',
        description: 'Expert advice on DeFi strategies, yield farming, and portfolio management. Maximize your returns in DeFi.',
        price: 100,
        currency: 'USDC',
        deliveryDays: 1,
        category: 'Consulting',
        tags: ['defi', 'yield-farming', 'trading'],
        status: 'active',
        createdAt: new Date(now.getTime() - 1 * oneDayInMs),
        updatedAt: new Date(now.getTime() - 1 * oneDayInMs)
      }
    ];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
}

function ServicesList() {
  const { context } = useMiniApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check for success message on initial load
  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setShowSuccess(true);
      // Clear the success message after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
        // Remove the query parameter without reloading the page
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('created');
        window.history.replaceState({}, '', newUrl.toString());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const fetchedServices = await getServices();
        setServices(fetchedServices);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Services</h1>
          {context?.user && (
            <Link href="/services/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                Create Service
              </Button>
            </Link>
          )}
        </div>

        {showSuccess && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-100 rounded">
            Service created successfully!
          </div>
        )}

        {services.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No services found. Be the first to create one!</p>
            {context?.user && (
              <div className="mt-4">
                <Link href="/services/new">
                  <Button>Create Service</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return <ServicesList />;
}
