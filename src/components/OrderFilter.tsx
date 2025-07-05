'use client';

import { useState } from 'react';
import { Button } from './ui/Button';

type FilterType = 'purchased' | 'sold';

interface OrderFilterProps {
  onFilterChange: (filter: FilterType) => void;
  initialFilter?: FilterType;
}

export function OrderFilter({ onFilterChange, initialFilter = 'purchased' }: OrderFilterProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter);

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className="flex space-x-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <Button
        variant={activeFilter === 'purchased' ? 'primary' : 'ghost'}
        onClick={() => handleFilterClick('purchased')}
        className="mr-2"
      >
        Purchased
      </Button>
      <Button
        variant={activeFilter === 'sold' ? 'primary' : 'ghost'}
        onClick={() => handleFilterClick('sold')}
      >
        Sold
      </Button>
    </div>
  );
}
