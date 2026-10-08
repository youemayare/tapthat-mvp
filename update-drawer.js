const fs = require('fs');
let content = fs.readFileSync('src/components/profile/exchange-details-drawer.tsx', 'utf8');

// Add Select imports
if (!content.includes('from \'@/components/ui/select\'')) {
    content = content.replace(
        'import { Input } from \'@/components/ui/input\';',
        'import { Input } from \'@/components/ui/input\';\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from \'@/components/ui/select\';'
    );
}

// Change Profile type
const oldProfileType = `type Profile = {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  isDefault: boolean;
};`;

const newProfileType = `type Profile = {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  isDefault: boolean;
};`;

content = content.replace(oldProfileType, newProfileType);

// Add logic to autofill form data when a profile is selected
const oldFetch = `            if (data.profiles) {
              setProfiles(data.profiles);
              const defaultProfile = data.profiles.find((p: Profile) => p.isDefault);
              if (defaultProfile) {
                setSelectedProfileId(defaultProfile.id);
              } else if (data.profiles.length > 0) {
                setSelectedProfileId(data.profiles[0].id);
              }
            }`;

const newFetch = `            if (data.profiles) {
              setProfiles(data.profiles);
              const defaultProfile = data.profiles.find((p: Profile) => p.isDefault) || data.profiles[0];
              if (defaultProfile) {
                setSelectedProfileId(defaultProfile.id);
                setFormData(prev => ({
                  ...prev,
                  firstName: defaultProfile.firstName || '',
                  lastName: defaultProfile.lastName || '',
                  jobTitle: defaultProfile.jobTitle || '',
                  companyName: defaultProfile.companyName || '',
                  email: defaultProfile.email || '',
                  phone: defaultProfile.phone || '',
                }));
              }
            }`;

content = content.replace(oldFetch, newFetch);

// Replace render logic
const startToken = '<div className="p-4 pb-0 max-h-[60vh] overflow-y-auto">';
const startIndex = content.indexOf(startToken);
const endToken = '</DrawerContent>';
const endIndex = content.indexOf(endToken, startIndex);

if (startIndex > 0 && endIndex > startIndex) {
    const oldRender = content.substring(startIndex, endIndex);

    const newRender = `<div className="p-4 pb-0 max-h-[60vh] overflow-y-auto">
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
                        setSelectedProfileId(val);
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
                               {name} {subtitle ? \`(\${subtitle})\` : ''}
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
                  placeholder={\`e.g., Met at the tech conference\`}
                  value={formData.note}
                  onChange={(e) => setFormData(p => ({ ...p, note: e.target.value }))}
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
        `;
    content = content.replace(oldRender, newRender);
} else {
    console.log("Failed to find render bounds");
}

// Ensure payload uses formData for logged in users as well
const oldPayload = `      const payload = !isSubmittingAsGuest 
        ? {
            type: 'tayz_profile',
            targetProfileId,
            sourceProfileId: selectedProfileId,
            sourceCardUid: cardUid,
            sourceChannel,
          }
        : {`;

const newPayload = `      const payload = !isSubmittingAsGuest 
        ? {
            type: 'tayz_profile',
            targetProfileId,
            sourceProfileId: selectedProfileId,
            sourceCardUid: cardUid,
            sourceChannel,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            jobTitle: formData.jobTitle,
            companyName: formData.companyName,
          }
        : {`;

content = content.replace(oldPayload, newPayload);

fs.writeFileSync('src/components/profile/exchange-details-drawer.tsx', content);
console.log('Update Complete');
