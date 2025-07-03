import { useState } from 'react';
import { Service } from '../types/service';
import { Button } from './ui/Button';

// Define a minimal type for the user prop to avoid dependency on external packages
interface CurrentUser {
  fid: number | string;
}

interface ServiceCardProps {
  service: Service;
  currentUser: CurrentUser | null;
}

export default function ServiceCard({ service, currentUser }: ServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  // Check if the current user is the service creator.
  const isServiceCreator = !!currentUser?.fid && currentUser.fid.toString() === service.fid.toString();

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleBookNow = () => {
    setShowBookingForm(true);
  }; 
  
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          providerFid: service.fid,
          // Add any other required booking fields
        }),
      });
      
      if (!response.ok) throw new Error('Failed to book service');
      
      alert('Booking request sent successfully!');
      setShowBookingForm(false);
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book service. Please try again.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {service.title}
          </h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 whitespace-nowrap">
            {service.currency} {service.price.toFixed(2)}
          </span>
        </div>
        
        <div className="mb-4">
          <p className={`text-gray-600 dark:text-gray-300 text-sm ${isExpanded ? '' : 'line-clamp-3'}`}>
            {service.description}
          </p>
          
          {isExpanded && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Category:</span>
                <span className="text-gray-600 dark:text-gray-400">{service.category}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Delivery:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {service.deliveryDays} day{service.deliveryDays !== 1 ? 's' : ''}
                </span>
              </div>
              {service.userName && (
                <div className="flex items-center text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300 w-24">Provider:</span>
                  <div className="flex items-center">
                    {service.userPfp && (
                      <img 
                        src={service.userPfp} 
                        alt={service.userName}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    )}
                    <span className="text-gray-600 dark:text-gray-400">{service.userName}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {service.tags.map((tag, index) => (
            <span 
              key={index} 
              className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Posted on: {service.createdAt ? new Date(service.createdAt).toLocaleDateString() : 'N/A'}</span>
          <div className="flex space-x-2">
                                    {!isServiceCreator && currentUser && (
              <Button 
                onClick={handleBookNow}
                size="sm"
                variant="outline"
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                Book Now
              </Button>
            )}
            <button 
              onClick={toggleExpand}
              className="text-blue-600 hover:underline dark:text-blue-400 font-medium focus:outline-none text-sm"
            >
              {isExpanded ? 'Show Less' : 'View Details'}
            </button>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Book {service.title}</h3>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Requirements
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  rows={4}
                  placeholder="Describe what you need..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBookingForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Confirm Booking
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
