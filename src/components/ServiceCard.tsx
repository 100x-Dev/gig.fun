import Link from 'next/link';
import { Service } from '../types/service';

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
            {service.title}
          </h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
            {service.currency} {service.price.toFixed(2)}
          </span>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
          {service.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-300">
            {service.category}
          </span>
          {service.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-700 dark:text-gray-300">
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Delivery: {service.deliveryDays} day{service.deliveryDays !== 1 ? 's' : ''}</span>
          <Link 
            href={`/services/${service.id}`}
            className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
