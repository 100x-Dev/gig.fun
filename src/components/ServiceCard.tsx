import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import PaymentFormNew from './PaymentFormNew';
import { Service } from '~/types/service';
import { CurrentUser } from '~/types/user';

// Define a minimal type for the user prop to avoid dependency on external packages
interface ServiceCardProps {
  service: Service;
  currentUser: CurrentUser | null;
  showActions?: boolean;
  onStatusChange?: () => void;
}

export default function ServiceCard({ service, currentUser, showActions = false, onStatusChange }: ServiceCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/services/edit/${service.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to deactivate this service?')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'inactive' }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update service status');
      }

      // Refresh the services list through the parent component
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err) {
      console.error('Error deactivating service:', err);
      setError(err instanceof Error ? err.message : 'Failed to deactivate service');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-[var(--card-bg)] rounded-soft shadow-soft overflow-hidden border-0 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="p-6">
        {/* Service Title and Price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-black">
            {service.title}
          </h3>
          <span className="bg-[var(--primary-light)/10] text-black text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap">
            {service.currency} {service.price.toFixed(2)}
          </span>
        </div>

        {/* Provider Details - Always visible */}
        {service.userName && (
          <div className="flex items-center text-sm mb-4">
            <span className="font-medium text-black w-24">Provider:</span>
            <div className="flex items-center">
              {service.userPfp && (
                <img
                  src={service.userPfp}
                  alt={service.userName}
                  className="w-6 h-6 rounded-full mr-2 border border-[var(--primary-light)]"
                />
              )}
              <span className="text-black">{service.userName}</span>
            </div>
          </div>
        )}

        {/* Service Description */}
        <div className="mb-4">
          <p className={`text-black text-sm ${isExpanded ? '' : 'line-clamp-3'}`}>
            {service.description}
          </p>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center text-sm">
                <span className="font-medium text-black w-24">Category:</span>
                <span className="text-black">{service.category}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-medium text-black w-24">Delivery:</span>
                <span className="text-black">
                  {service.deliveryDays} day{service.deliveryDays !== 1 ? 's' : ''}
                </span>
              </div>
              
              {/* Tags - Moved inside expandable section */}
              <div className="flex flex-wrap gap-2 mt-2">
                {service.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-0.5 text-xs font-medium bg-[var(--primary-light)/10] text-black rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer with actions */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border-color)]">
          <button
            onClick={toggleExpand}
            className="text-sm text-black hover:underline transition-all duration-200"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>

          <div className="flex items-center gap-2">
            {showActions && isServiceCreator && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)/10]"
                  onClick={handleEdit}
                  title="Edit service"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-50"
                    onClick={handleDelete}
                    title="Deactivate service"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                  {error && (
                    <div className="absolute left-full ml-2 mt-1 w-48 rounded-soft bg-red-50 p-2 text-xs text-red-600 shadow-soft">
                      {error}
                    </div>
                  )}
                </div>
              </>
            )}

            {currentUser && !isServiceCreator && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const recipientFid = service.fid;
                    const defaultMessage = `Hi, I'm interested in your service "${service.title}"`;
                    const encodedMessage = encodeURIComponent(defaultMessage);
                    const messageUrl = `https://farcaster.xyz/~/inbox/create/${recipientFid}?text=${encodedMessage}`;
                    
                    try {
                      // Import and use the SDK dynamically
                      // This is the correct way to use the SDK for iOS compatibility
                      import('@farcaster/miniapp-sdk').then(({ sdk }) => {
                        sdk.actions.openUrl(messageUrl);
                      }).catch(err => {
                        console.error('Error importing Farcaster SDK:', err);
                        // Fallback to window.open if SDK import fails
                        window.open(messageUrl, '_blank');
                      });
                    } catch (error) {
                      console.error('Error using Farcaster SDK:', error);
                      // Fallback to window.open
                      window.open(messageUrl, '_blank');
                    }
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button
                  onClick={handleBookNow}
                  className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold py-2 px-4 rounded-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  Book Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      </div>

      {/* Payment Form Modal */}
      {showBookingForm && (
        <PaymentFormNew service={service} onClose={handleCloseBookingForm} />
      )}
    </>
  );
}
