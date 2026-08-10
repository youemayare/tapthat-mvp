'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Profile {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface ProfileFilterProps {
  profiles: Profile[];
  selectedProfileId: string | null;
}

export function ProfileFilter({ profiles, selectedProfileId }: ProfileFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleValueChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('profile');
    } else {
      params.set('profile', value);
    }
    
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter by Profile:</span>
      <Select
        value={selectedProfileId || 'all'}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-[200px] h-9">
          <SelectValue placeholder="Select a profile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Profiles</SelectItem>
          {profiles.map((p) => {
            const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unnamed Profile';
            const label = p.label ? ` (${p.label})` : '';
            return (
              <SelectItem key={p.id} value={p.id}>
                {name}{label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
