'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Turnstile } from '@marsidev/react-turnstile';

interface ExchangeDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetProfileId: string;
  targetProfileName: string;
  isLoggedIn: boolean;
  onExchangeSuccess: () => void;
  cardUid?: string;
  exchangeStatus: 'pending' | 'accepted' | null;
  sourceChannel?: 'nfc' | 'qr' | 'direct_link';
  onGuestFlowComplete?: (wasSubmitted: boolean, successData?: { id: string, erasureToken: string }) => void;
}

type Profile = {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  isDefault: boolean;
};;

export function ExchangeDetailsDrawer({
  open,
  onOpenChange,
  targetProfileId,
  targetProfileName,
  isLoggedIn,
  onExchangeSuccess,
  cardUid,
  exchangeStatus,
  sourceChannel = 'direct_link',
  onGuestFlowComplete,
}: ExchangeDetailsDrawerProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [isExchanging, setIsExchanging] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string, erasureToken: string } | null>(null);
  const [hasCheckedProfiles, setHasCheckedProfiles] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    jobTitle: '',
    notes: '',
    turnstileToken: '',
    consentGiven: false,
  });

  useEffect(() => {
    if (open && isLoggedIn && profiles.length === 0 && !exchangeStatus && !hasCheckedProfiles) {
      setLoadingProfiles(true);
      fetch('/api/profiles')
        .then((res) => res.json())
        .then((data) => {
          if (data.profiles) {
            setProfiles(data.profiles);
            const defaultProfile = data.profiles.find((p: Profile) => p.isDefault);
            if (defaultProfile) {
              setSelectedProfileId(defaultProfile.id || "");
            } else if (data.profiles.length > 0) {
              setSelectedProfileId(data.profiles[0].id || "");
            }
          }
        })
        .catch(() => toast.error('Failed to load your profiles'))
        .finally(() => {
          setLoadingProfiles(false);
          setHasCheckedProfiles(true);
        });
    } else if (open && !isLoggedIn) {
      setHasCheckedProfiles(true);
    }
  }, [open, isLoggedIn, profiles.length, exchangeStatus, hasCheckedProfiles]);

  const isSubmittingAsGuest = !isLoggedIn || (hasCheckedProfiles && profiles.length === 0);

  async function handleExchange() {
    if (!isSubmittingAsGuest && !selectedProfileId) {
      toast.error('Please select a profile to share');
      return;
    }

    if (isSubmittingAsGuest) {
      if (!formData.firstName) {
        toast.error('First name is required');
        return;
      }
      if (!formData.email && !formData.phone) {
        toast.error('Please provide an email or phone number');
        return;
      }
      if (!formData.consentGiven) {
        toast.error('You must consent to sharing your details');
        return;
      }
      if (!formData.turnstileToken) {
        toast.error('Please complete the captcha');
        return;
      }
    }

    setIsExchanging(true);

    try {
      const endpoint = !isSubmittingAsGuest ? '/api/exchange' : '/api/exchange/anonymous';
      const payload = !isSubmittingAsGuest 
        ? {
            type: 'tayz_profile',
            targetProfileId,
            sourceProfileId: selectedProfileId,
            sourceCardUid: cardUid,
            sourceChannel,
          }
        : {
            targetProfileId,
            sourceChannel,
            ...formData,
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to exchange details');
      }

      toast.success('Details shared successfully');
      
      if (!isLoggedIn && data.erasureToken) {
        setSuccessData({ id: data.id, erasureToken: data.erasureToken });
      } else {
        onExchangeSuccess();
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsExchanging(false);
    }
  }

  // If already exchanged
  if (exchangeStatus) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="mx-auto max-w-lg">
          <DrawerHeader>
            <DrawerTitle>
              {exchangeStatus === 'accepted' ? 'Details Shared ✓' : 'Exchange Pending'}
            </DrawerTitle>
            <DrawerDescription>
              {exchangeStatus === 'accepted' 
                ? `You have already shared your details with ${targetProfileName}.`
                : `Your request to share details with ${targetProfileName} is pending.`}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // If successful anonymous exchange
  if (successData) {
    const removalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/remove-exchange/${successData.id}/${successData.erasureToken}`;
    
    return (
      <Drawer open={open} onOpenChange={(val) => {
        if (!val) {
          onExchangeSuccess();
          if (onGuestFlowComplete) {
            onGuestFlowComplete(true, successData);
          } else {
            onOpenChange(false);
          }
          setSuccessData(null);
        }
      }}>
        <DrawerContent className="mx-auto max-w-lg">
          <DrawerHeader>
            <DrawerTitle>Details Shared ✓</DrawerTitle>
            <DrawerDescription>
              Your information has been sent to {targetProfileName}.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0 text-center">
            <div className="p-4 bg-muted border rounded-xl text-sm space-y-3">
              <p className="font-medium text-foreground">Important Privacy Link</p>
              <p className="text-muted-foreground text-xs text-left">
                Because you are not logged in, this is the only way to revoke access or remove your details in the future.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Input value={removalUrl} readOnly className="h-8 text-xs bg-background" />
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="h-8 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(removalUrl);
                    toast.success('Copied to clipboard');
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-red-500/80 font-medium pt-1">
                Save this link! It will not be shown again.
              </p>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={() => {
              onExchangeSuccess();
              if (onGuestFlowComplete) {
                onGuestFlowComplete(true, successData);
              } else {
                onOpenChange(false);
              }
              setSuccessData(null);
            }}>Done</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(val) => {
      if (!val) {
        if (onGuestFlowComplete) {
          onGuestFlowComplete(false);
        } else {
          onOpenChange(false);
        }
      } else {
        onOpenChange(val);
      }
    }}>
      <DrawerContent className="mx-auto max-w-lg">
        <DrawerHeader>
          <DrawerTitle>Share your details with {targetProfileName}</DrawerTitle>
          <DrawerDescription>
            They'll receive your information in their private Tayz requests.
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 pb-0 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              
              {!isSubmittingAsGuest && (
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg border">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Select Profile to Share</Label>
                  {loadingProfiles ? (
                    <Skeleton className="h-10 w-full rounded-md" />
                  ) : (
                    <Select 
                      value={selectedProfileId} 
                      onValueChange={(val) => {
                        setSelectedProfileId(val || "");
                        const p = profiles.find(profile => profile.id === val);
                        if (p) {
                          setFormData(prev => ({
                            ...prev,
                            firstName: p.firstName || '',
                            lastName: p.lastName || '',
                            jobTitle: p.jobTitle || '',
                            companyName: p.companyName || '',
                            email: p.email || '',
                            phone: p.phone || '',
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Select a profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map(p => {
                           const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unnamed Profile';
                           const subtitle = [p.jobTitle, p.label].filter(Boolean).join(' • ');
                           return (
                             <SelectItem key={p.id} value={p.id}>
                               {name} {subtitle ? `(${subtitle})` : ''}
                             </SelectItem>
                           );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">Changes made below will permanently update this profile.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name *</Label>
                  <Input 
                    id="firstName" 
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input 
                    id="lastName"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                />
              </div>

              {!showMore && isSubmittingAsGuest ? (
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full text-sm text-muted-foreground"
                  onClick={() => setShowMore(true)}
                >
                  + Add more details (optional)
                </Button>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company</Label>
                    <Input 
                      id="companyName" 
                      autoComplete="organization"
                      value={formData.companyName}
                      onChange={(e) => setFormData(p => ({ ...p, companyName: e.target.value }))}
                    />
                  </div>
    
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input 
                      id="jobTitle" 
                      autoComplete="organization-title"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData(p => ({ ...p, jobTitle: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="note">Add a note (optional)</Label>
                <Textarea 
                  id="note" 
                  placeholder={`e.g., Met at the tech conference`}
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox 
                  id="consent" 
                  checked={formData.consentGiven}
                  onCheckedChange={(c) => setFormData(p => ({ ...p, consentGiven: c === true }))}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="consent" className="text-xs font-medium cursor-pointer">
                    I consent to share my details
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    By checking this box, you agree to share the information provided above with {targetProfileName}.
                  </p>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                {(!isLoggedIn || isSubmittingAsGuest) ? (
                  <Turnstile 
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                    onSuccess={(token) => setFormData(p => ({ ...p, turnstileToken: token }))}
                    options={{ theme: 'auto', size: 'compact' }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </DrawerContent>
    </Drawer>
  );
}
