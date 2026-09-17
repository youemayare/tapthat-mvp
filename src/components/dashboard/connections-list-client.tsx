'use client';

import { useState, useMemo } from 'react';
import { Search, UserCheck } from 'lucide-react';
import { ConnectionCard } from '@/components/dashboard/connection-card';
import { AcceptedExchangeCard } from '@/components/dashboard/accepted-exchange-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type CombinedItem = {
  type: 'connection';
  data: any;
  date: Date | string;
} | {
  type: 'manual';
  data: any;
  date: Date | string;
};

interface Props {
  initialItems: CombinedItem[];
}

export function ConnectionsListClient({ initialItems }: Props) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date-desc');
  const [timeframe, setTimeframe] = useState('all');
  const [company, setCompany] = useState('all');

  const uniqueCompanies = useMemo(() => {
    const set = new Set<string>();
    initialItems.forEach(item => {
      const comp = item.type === 'connection' ? item.data.profile.companyName : item.data.company;
      if (comp && comp.trim()) set.add(comp.trim());
    });
    return Array.from(set).sort();
  }, [initialItems]);

  const filteredAndSorted = useMemo(() => {
    let result = [...initialItems];

    // 1. Timeframe Filter
    if (timeframe !== 'all') {
      const now = new Date();
      let threshold = new Date(0);
      if (timeframe === '7d') threshold = new Date(now.setDate(now.getDate() - 7));
      if (timeframe === '30d') threshold = new Date(now.setDate(now.getDate() - 30));
      if (timeframe === '1y') threshold = new Date(now.setFullYear(now.getFullYear() - 1));
      
      result = result.filter(item => new Date(item.date) >= threshold);
    }

    // 2. Company Filter
    if (company !== 'all') {
      result = result.filter(item => {
        const comp = item.type === 'connection' ? item.data.profile.companyName : item.data.company;
        return comp?.trim() === company;
      });
    }

    // 3. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item => {
        if (item.type === 'connection') {
          const { profile, note } = item.data;
          const name = `${profile.firstName || ''} ${profile.lastName || ''}`.toLowerCase();
          return name.includes(q) || 
                 (profile.jobTitle || '').toLowerCase().includes(q) ||
                 (profile.companyName || '').toLowerCase().includes(q) ||
                 (note?.content || '').toLowerCase().includes(q);
        } else {
          const exchange = item.data;
          const name = (exchange.name || '').toLowerCase();
          return name.includes(q) || 
                 (exchange.jobTitle || '').toLowerCase().includes(q) ||
                 (exchange.company || '').toLowerCase().includes(q) ||
                 (exchange.message || '').toLowerCase().includes(q);
        }
      });
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sort === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sort === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      
      const nameA = (a.type === 'connection' ? `${a.data.profile.firstName || ''} ${a.data.profile.lastName || ''}` : a.data.name || '').trim().toLowerCase();
      const nameB = (b.type === 'connection' ? `${b.data.profile.firstName || ''} ${b.data.profile.lastName || ''}` : b.data.name || '').trim().toLowerCase();
      
      if (sort === 'name-asc') return nameA.localeCompare(nameB);
      if (sort === 'name-desc') return nameB.localeCompare(nameA);
      
      if (sort === 'company-asc') {
        const compA = (a.type === 'connection' ? a.data.profile.companyName : a.data.company || '').toLowerCase();
        const compB = (b.type === 'connection' ? b.data.profile.companyName : b.data.company || '').toLowerCase();
        return compA.localeCompare(compB);
      }
      
      return 0;
    });

    return result;
  }, [initialItems, search, sort, timeframe, company]);

  const SORT_LABELS: Record<string, string> = {
    'date-desc': 'Newest',
    'date-asc': 'Oldest',
    'name-asc': 'Name (A-Z)',
    'name-desc': 'Name (Z-A)',
    'company-asc': 'Company (A-Z)'
  };

  const TIMEFRAME_LABELS: Record<string, string> = {
    'all': 'All Time',
    '7d': '7 Days',
    '30d': '30 Days',
    '1y': 'This Year'
  };

  if (initialItems.length === 0) {
    return (
      <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm mt-8">
        <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserCheck className="w-8 h-8 text-brand-500" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">No connections yet</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          When you tap someone's Anoya card and hit "Save to My Connections", they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      
      <div className="flex flex-col gap-3">
        {/* Search Bar - Separate & Top */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, job, company, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 shadow-sm transition-shadow"
          />
        </div>

        {/* Sort & Filters row */}
        <div className="flex items-center w-full gap-2">
          
          {/* Sort */}
          <div className="flex-1 min-w-0">
            <Select value={sort} onValueChange={(v) => v && setSort(v)}>
              <SelectTrigger className="h-10 w-full bg-card border border-border shadow-sm hover:bg-accent/50 rounded-xl px-2.5 sm:px-3 focus:ring-2 focus:ring-brand-500/50 font-medium text-xs sm:text-sm text-foreground">
                <SelectValue>{SORT_LABELS[sort]}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="date-desc">Newest</SelectItem>
                <SelectItem value="date-asc">Oldest</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="company-asc">Company (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timeframe */}
          <div className="flex-1 min-w-0">
            <Select value={timeframe} onValueChange={(v) => v && setTimeframe(v)}>
              <SelectTrigger className="h-10 w-full bg-card border border-border shadow-sm hover:bg-accent/50 rounded-xl px-2.5 sm:px-3 focus:ring-2 focus:ring-brand-500/50 text-xs sm:text-sm font-medium text-foreground">
                <SelectValue>{TIMEFRAME_LABELS[timeframe]}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="1y">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Company */}
          {uniqueCompanies.length > 0 && (
            <div className="flex-1 min-w-0">
              <Select value={company} onValueChange={(v) => v && setCompany(v)}>
                <SelectTrigger className="h-10 w-full bg-card border border-border shadow-sm hover:bg-accent/50 rounded-xl px-2.5 sm:px-3 focus:ring-2 focus:ring-brand-500/50 text-xs sm:text-sm font-medium text-foreground">
                  <SelectValue>
                    {company === 'all' ? 'Company' : company}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl max-w-[200px]">
                  <SelectItem value="all">Any Company</SelectItem>
                  {uniqueCompanies.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Results Grid */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-3xl shadow-sm">
          <p className="text-muted-foreground">No connections match your filters.</p>
          <button 
            onClick={() => { setSearch(''); setSort('date-desc'); setTimeframe('all'); setCompany('all'); }}
            className="text-brand-500 font-medium text-sm mt-4 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map((item) => {
            if (item.type === 'connection') {
              const { connection, profile, note } = item.data;
              return (
                <ConnectionCard 
                  key={`conn-${connection.id}`} 
                  connection={connection} 
                  profile={profile} 
                  note={note} 
                />
              );
            } else {
              const exchange = item.data;
              return (
                <AcceptedExchangeCard
                  key={`exch-${exchange.id}`}
                  exchange={exchange}
                />
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
