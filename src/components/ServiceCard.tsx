import { useState } from 'react';
import { Service } from '../types/service';
import { Button } from './ui/Button';
import PaymentForm from './PaymentForm';

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

  const handleCloseBookingForm = () => {
    setShowBookingForm(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300">
      <div className="p-6">
        {/* Service Title and Price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {service.title}
          </h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 whitespace-nowrap">
            {service.currency} {service.price.toFixed(2)}
          </span>
        </div>

        {/* Service Description */}
        <div className="mb-4">
          <p className={`text-gray-600 dark:text-gray-300 text-sm ${isExpanded ? '' : 'line-clamp-3'}`}>
            {service.description}
          </p>

          {/* Expanded Details */}
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

        {/* Tags */}
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

        {/* Card Footer with actions */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleExpand}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>

          {currentUser && !isServiceCreator && (
            <Button
              onClick={handleBookNow}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Book Now
            </Button>
          )}
        </div>
      </div>

      {/* Payment Form Modal */}
      {showBookingForm && (
        <PaymentForm service={service} onClose={handleCloseBookingForm} />
      )}
    </div>
  );
}
