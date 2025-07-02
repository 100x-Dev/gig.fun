'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMiniApp } from '@neynar/react';
import { serviceCategories } from '~/types/service';

type ServiceFormData = {
  title: string;
  description: string;
  price: string;
  currency: 'ETH' | 'USDC';
  deliveryDays: string;
  category: string;
  tags: string;
};

export default function CreateServiceForm() {
  const router = useRouter();
  const { context } = useMiniApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  
  const [formData, setFormData] = useState<ServiceFormData>({
    title: '',
    description: '',
    price: '',
    currency: 'USDC',
    deliveryDays: '3',
    category: serviceCategories[0] || '',
    tags: ''
  });

  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!context?.user?.fid) {
      setError('Please connect with Farcaster to create a service');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      console.log('Starting service creation...');
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      console.log('Sending request to /api/services with data:', {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        currency: formData.currency,
        delivery_days: formData.deliveryDays,
        category: formData.category,
        tags: tags
      });
      
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          currency: formData.currency,
          delivery_days: parseInt(formData.deliveryDays, 10),
          category: formData.category,
          tags: tags
        }),
      });

      if (!response.ok) {
        console.error('Server responded with status:', response.status);
        let errorData;
        try {
          errorData = await response.json();
          console.error('Error response data:', errorData);
        } catch (jsonError) {
          console.error('Failed to parse error response:', jsonError);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const errorMessage = errorData?.details || errorData?.error || 'Failed to create service';
        throw new Error(errorMessage);
      }

      console.log('Service created successfully, redirecting...');
      // Redirect to services page with success state
      router.push('/services?created=true');
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!context?.user?.fid) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Sign In Required</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">Please sign in with Farcaster to create a service.</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div className="flex items-center mb-6">
        {context.user.pfpUrl && (
          <img 
            src={context.user.pfpUrl} 
            alt={context.user.displayName || 'User'} 
            className="w-10 h-10 rounded-full mr-3"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create a New Service</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {context.user.displayName || `@${context.user.username}`}
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-100 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Service Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., I will design a professional logo"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Describe your service in detail..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price *
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full pl-4 pr-20 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 dark:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-r-md"
                >
                  <option value="USDC">USDC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="deliveryDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Delivery Time (days) *
            </label>
            <input
              type="number"
              id="deliveryDays"
              name="deliveryDays"
              value={formData.deliveryDays}
              onChange={handleChange}
              min="1"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., 7"
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select a category</option>
            {serviceCategories.map((category: string) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., design, logo, branding (comma separated)"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Add relevant tags separated by commas (max 5 tags)
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Service'}
          </button>
        </div>
      </form>
    </div>
  );
}
