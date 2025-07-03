"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Textarea } from '~/components/ui/Textarea';
import { Label } from '~/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/Select';
import { Service } from '~/types/service';

export default function EditServicePage() {
  const router = useRouter();
  const { id } = useParams();
  const { data: session } = useSession();
  const user = session?.user;
  
  const [formData, setFormData] = useState<Partial<Service>>({
    title: '',
    description: '',
    price: 0,
    currency: 'USDC',
    deliveryDays: 1,
    category: '',
    tags: [],
    status: 'active',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Fetch service data
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/services/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch service');
        }
        const data = await response.json();
        
        // Verify that the current user is the owner of the service
        if (data.fid !== user?.fid) {
          throw new Error('Unauthorized');
        }
        
        // Ensure fetched data doesn't have null/undefined for controlled components
        const sanitizedData = {
          ...data,
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          tags: data.tags || [],
          price: data.price || 0,
          deliveryDays: data.deliveryDays || 1,
          currency: data.currency || 'USDC',
        };
        setFormData(prev => ({ ...prev, ...sanitizedData }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load service');
      } finally {
        setIsLoading(false);
      }
    };

    if (id && user?.fid) {
      fetchService();
    }
  }, [id, user?.fid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSelectChange = (name: keyof Service, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.fid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          deliveryDays: Number(formData.deliveryDays),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update service');
      }

      // Redirect to the my-gigs page after successful update
      router.push('/my-gigs');
      router.refresh(); // Refresh the page to show updated data
    } catch (err) {
      console.error('Error updating service:', err);
      setError(err instanceof Error ? err.message : 'Failed to update service');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-lg font-medium">Error</p>
          <p className="mt-2">{error}</p>
          <Button 
            onClick={() => router.back()} 
            className="mt-4"
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="mr-2 p-2"
        >←
        </Button>
        <h1 className="text-2xl font-bold">Edit Service</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title">Service Title</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., I will design a modern website"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            placeholder="Describe your service in detail..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price">Price</Label>
            <div className="relative">
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => handleSelectChange('currency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="deliveryDays">Delivery Time (days)</Label>
            <Input
              id="deliveryDays"
              name="deliveryDays"
              type="number"
              min="1"
              value={formData.deliveryDays}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleSelectChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Development">Development</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Writing">Writing</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Music">Music</SelectItem>
              <SelectItem value="Lifestyle">Lifestyle</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" onClick={handleAddTag} variant="outline">
              Add
            </Button>
          </div>
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <div 
                  key={tag} 
                  className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <span>←</span> Back
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
