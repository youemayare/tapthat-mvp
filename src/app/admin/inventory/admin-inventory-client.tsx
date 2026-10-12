'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminLogoutAction, adminProvisionSingleCardAction, adminProvisionBatchAction } from '../actions';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  CreditCard,
  PlusCircle,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LogOut,
  Search,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Box,
  Layers,
  Sparkles,
  Shield,
  ArrowUpRight,
} from 'lucide-react';

interface CardRow {
  id: string;
  cardUid: string;
  cardType: string | null;
  label: string | null;
  status: string;
  userId: string | null;
  userEmail: string | null;
  profileSlug: string | null;
  createdAt: string;
  activatedAt: string | null;
}

interface Stats {
  total: number;
  unclaimed: number;
  active: number;
  deactivated: number;
  metal: number;
  pvc: number;
  wood: number;
}

interface Props {
  adminEmail: string;
  stats: Stats;
  initialCards: CardRow[];
}

export function AdminInventoryClient({ adminEmail, stats, initialCards }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');

  // Single UID state
  const [singleUid, setSingleUid] = useState('');
  const [singleType, setSingleType] = useState('metal');
  const [singleLabel, setSingleLabel] = useState('');

  // Batch Ingestion state
  const [batchContent, setBatchContent] = useState('');
  const [batchDefaultType, setBatchDefaultType] = useState('metal');
  const [batchFileName, setBatchFileName] = useState<string | null>(null);

  // Status & feedback
  const [isPending, startTransition] = useTransition();
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    details?: string[];
  } | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const handleCopy = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);

    startTransition(async () => {
      const res = await adminProvisionSingleCardAction({
        uid: singleUid,
        cardType: singleType,
        label: singleLabel || undefined,
      });

      if ('error' in res) {
        setActionFeedback({
          type: 'error',
          title: 'Provisioning Failed',
          message: res.error,
        });
        return;
      }

      const item = res.items[0];
      if (item?.status === 'inserted') {
        setActionFeedback({
          type: 'success',
          title: 'Card Provisioned Successfully',
          message: `UID ${item.uid} registered as unclaimed ${item.cardType?.toUpperCase()} inventory.`,
        });
        setSingleUid('');
        setSingleLabel('');
        router.refresh();
      } else if (item?.status === 'skipped_existing') {
        setActionFeedback({
          type: 'warning',
          title: 'Already In Stock',
          message: `UID ${item.uid} already exists as an unclaimed card in inventory.`,
        });
      } else if (item?.status === 'skipped_claimed') {
        setActionFeedback({
          type: 'warning',
          title: 'Protected Active Card',
          message: `UID ${item.uid} is already claimed by an active user. Skipped to prevent overwrite.`,
        });
      } else {
        setActionFeedback({
          type: 'error',
          title: 'Invalid UID Format',
          message: item?.reason || 'UID must be 8-64 alphanumeric characters.',
        });
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBatchFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBatchContent(text || '');
    };
    reader.readAsText(file);
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);

    startTransition(async () => {
      const res = await adminProvisionBatchAction({
        rawContent: batchContent,
        defaultCardType: batchDefaultType,
      });

      if ('error' in res) {
        setActionFeedback({
          type: 'error',
          title: 'Batch Ingestion Failed',
          message: res.error,
        });
        return;
      }

      const detailsList: string[] = [];
      if (res.skippedClaimed > 0) {
        detailsList.push(`🛡️ ${res.skippedClaimed} active cards protected & preserved.`);
      }
      if (res.skippedExisting > 0) {
        detailsList.push(`ℹ️ ${res.skippedExisting} cards were already in stock.`);
      }
      if (res.invalid > 0) {
        detailsList.push(`❌ ${res.invalid} invalid lines skipped.`);
      }

      setActionFeedback({
        type: res.inserted > 0 ? 'success' : 'warning',
        title: `Batch Complete: ${res.inserted} Added`,
        message: `Processed ${res.total} total lines. ${res.inserted} newly added to inventory.`,
        details: detailsList,
      });

      setBatchContent('');
      setBatchFileName(null);
      router.refresh();
    });
  };

  // Filter cards for table
  const filteredCards = initialCards.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.cardUid.toLowerCase().includes(query) ||
      c.status.toLowerCase().includes(query) ||
      (c.cardType && c.cardType.toLowerCase().includes(query)) ||
      (c.label && c.label.toLowerCase().includes(query)) ||
      (c.userEmail && c.userEmail.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors selection:bg-[#0071e3]/30">
      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <header className="border-b border-border bg-card/60 backdrop-blur-xl sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity">
              TAYZ
            </Link>
            <div className="h-4 w-[1px] bg-border mx-1" />
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold tracking-wide">
              <Shield className="w-3 h-3" />
              <span>Hardware Ops</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border">
              <div className="text-right">
                <p className="text-xs font-medium text-foreground leading-none">{adminEmail}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Super Admin</p>
              </div>
            </div>

            <form action={adminLogoutAction}>
              <button
                type="submit"
                className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ─────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Hardware Inventory & Provisioning</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Register factory NTAG215 chips, manage physical stock, and inspect card activation states.
          </p>
        </div>

        {/* ── Inventory Metric Cards (4 Harmonious Cards) ──────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Cards */}
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Hardware</span>
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold tracking-tight text-foreground">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Chips registered in database</p>
            </div>
          </div>

          {/* Card 2: In Stock (Unclaimed) */}
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">In Stock (Unclaimed)</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Box className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold tracking-tight text-foreground">{stats.unclaimed}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready for laser engraving & ship</p>
            </div>
          </div>

          {/* Card 3: Active (Claimed) */}
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Active (Claimed)</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold tracking-tight text-foreground">{stats.active}</div>
              <p className="text-xs text-muted-foreground mt-1">Linked to live user profiles</p>
            </div>
          </div>

          {/* Card 4: Finishes Breakdown */}
          <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Finishes In Fleet</span>
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold tracking-tight text-foreground">{stats.metal} Metal</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pvc} PVC · {stats.wood} Wood
              </p>
            </div>
          </div>
        </section>

        {/* ── Provisioning Card ────────────────────────────────────────────── */}
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-brand-400" />
                <span>Provision Blank Cards</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Register raw NFC chip serials so customers can claim them instantly upon tap.
              </p>
            </div>

            {/* Segmented Control Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-muted border border-border/80 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'single'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Single UID Scan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('batch')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'batch'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Bulk CSV / Text Upload
              </button>
            </div>
          </div>

          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div
              className={`p-4 rounded-xl border text-sm flex items-start gap-3 transition-all ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : actionFeedback.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
              }`}
            >
              {actionFeedback.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />}
              {actionFeedback.type === 'warning' && <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />}
              {actionFeedback.type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0 text-red-500" />}
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground">{actionFeedback.title}</div>
                <p className="text-xs opacity-90">{actionFeedback.message}</p>
                {actionFeedback.details && actionFeedback.details.length > 0 && (
                  <ul className="text-xs list-disc list-inside mt-2 space-y-0.5 opacity-90">
                    {actionFeedback.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Tab 1: Single UID Scan (Strict Horizontal Alignment) */}
          {activeTab === 'single' && (
            <form onSubmit={handleSingleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">
                    NFC Chip UID
                  </label>
                  <span className="text-[11px] text-muted-foreground">Auto-normalizes colons & hyphens</span>
                </div>
                <input
                  type="text"
                  required
                  value={singleUid}
                  onChange={(e) => setSingleUid(e.target.value)}
                  placeholder="e.g. 045BD2AA1B1291"
                  className="w-full h-11 px-4 rounded-xl bg-background border border-border text-foreground font-mono text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Card Finish
                </label>
                <select
                  value={singleType}
                  onChange={(e) => setSingleType(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
                >
                  <option value="metal">Metal (Matte)</option>
                  <option value="pvc">PVC (Standard)</option>
                  <option value="wood">Wood (Eco)</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Batch Tag (Optional)
                </label>
                <input
                  type="text"
                  value={singleLabel}
                  onChange={(e) => setSingleLabel(e.target.value)}
                  placeholder="Oct 2026 Batch"
                  className="w-full h-11 px-4 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isPending || !singleUid.trim()}
                  className="w-full h-11 px-4 rounded-xl font-medium text-sm text-white bg-[#0071e3] hover:bg-[#005bb8] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Provision Card</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Bulk CSV / Text Upload */}
          {activeTab === 'batch' && (
            <form onSubmit={handleBatchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Default Hardware Finish
                  </label>
                  <select
                    value={batchDefaultType}
                    onChange={(e) => setBatchDefaultType(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
                  >
                    <option value="metal">Metal (Matte)</option>
                    <option value="pvc">PVC (Standard)</option>
                    <option value="wood">Wood (Eco)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Or Upload Spreadsheet (.csv, .txt)
                  </label>
                  <label className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-background hover:bg-muted/50 border border-border cursor-pointer text-xs font-medium text-foreground transition-colors">
                    <Upload className="w-4 h-4 text-brand-400" />
                    <span>{batchFileName ? `Loaded: ${batchFileName}` : 'Choose CSV or text file'}</span>
                    <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-foreground">
                    Paste UIDs (One per line or CSV: UID, Finish, Batch Tag)
                  </label>
                  {batchContent && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      ~{batchContent.split(/\r?\n/).filter(Boolean).length} lines detected
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  required
                  value={batchContent}
                  onChange={(e) => setBatchContent(e.target.value)}
                  placeholder="045BD2AA1B1291&#10;04:6C:3E:22:9A:01:88&#10;04F981CA223011,metal,Batch 2"
                  className="w-full p-4 rounded-xl bg-background border border-border text-foreground font-mono text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isPending || !batchContent.trim()}
                  className="h-11 px-6 rounded-xl font-medium text-sm text-white bg-[#0071e3] hover:bg-[#005bb8] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Ingesting Batch...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Ingest Batch Into Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* ── Registered Hardware Table ────────────────────────────────────── */}
        <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Registered Hardware Cards</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time inventory view of physical chips and their active links.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search UID, status, email..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground/60 text-xs focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground uppercase font-mono text-[11px] font-semibold tracking-wider border-b border-border">
                <tr>
                  <th className="py-3.5 px-6">Card UID</th>
                  <th className="py-3.5 px-6">Finish</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Linked User / Profile</th>
                  <th className="py-3.5 px-6">Added On</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No cards match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((card) => (
                    <tr key={card.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-6 font-mono font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{card.cardUid}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(card.cardUid)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Copy UID"
                          >
                            {copiedUid === card.cardUid ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {card.label && (
                          <div className="text-[11px] text-muted-foreground font-sans mt-0.5">
                            {card.label}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span className="capitalize px-2.5 py-1 rounded-md bg-muted text-foreground border border-border font-medium">
                          {card.cardType || 'metal'}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {card.status === 'active' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-medium inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : card.status === 'unclaimed' ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-medium inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            In Stock (Unclaimed)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground font-medium">
                            {card.status}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        {card.userEmail ? (
                          <div>
                            <div className="font-medium text-foreground">{card.userEmail}</div>
                            {card.profileSlug && (
                              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                /p/{card.profileSlug}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 italic">Unassigned (In Stock)</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-muted-foreground whitespace-nowrap">
                        {new Date(card.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <a
                          href={`/n/${card.cardUid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
                        >
                          <span>Test Tap</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
