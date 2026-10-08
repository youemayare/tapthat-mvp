import fs

with open('src/components/profile/exchange-details-drawer.tsx', 'r') as f:
    content = f.read()

# Add Select imports
if 'from \'@/components/ui/select\'' not in content:
    content = content.replace(
        'import { Input } from \'@/components/ui/input\';',
        'import { Input } from \'@/components/ui/input\';\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from \'@/components/ui/select\';'
    )

# Change Profile type
old_profile_type = """type Profile = {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  isDefault: boolean;
};"""

new_profile_type = """type Profile = {
  id: string;
  label: string | null;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  isDefault: boolean;
};"""

content = content.replace(old_profile_type, new_profile_type)

# Add logic to autofill form data when a profile is selected
# Look for setSelectedProfileId and replace it with a handleProfileSelect
old_fetch = """            if (data.profiles) {
              setProfiles(data.profiles);
              const defaultProfile = data.profiles.find((p: Profile) => p.isDefault);
              if (defaultProfile) {
                setSelectedProfileId(defaultProfile.id);
              } else if (data.profiles.length > 0) {
                setSelectedProfileId(data.profiles[0].id);
              }
            }"""

new_fetch = """            if (data.profiles) {
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
            }"""

content = content.replace(old_fetch, new_fetch)

# Add autocomplete tags to guest form, and change it to show for logged in users as well
# 1. Look for `!isSubmittingAsGuest ? (`
old_render = """          <div className="p-4 pb-0 max-h-[60vh] overflow-y-auto">
            {!isSubmittingAsGuest ? (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Select a profile to share</h4>
                {loadingProfiles ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                ) : (
                  <RadioGroup value={selectedProfileId} onValueChange={setSelectedProfileId}>
                    {profiles.map((p) => {
                      const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unnamed Profile';
                      const subtitle = [p.jobTitle, p.label].filter(Boolean).join(' • ');
                      return (
                        <div key={p.id} className="flex items-center space-x-3 space-y-0 rounded-lg border p-4">
                          <RadioGroupItem value={p.id} id={`profile-${p.id}`} />
                          <Label htmlFor={`profile-${p.id}`} className="flex flex-col cursor-pointer">
                            <span className="font-medium">{name}</span>
                            {subtitle && <span className="text-muted-foreground text-sm">{subtitle}</span>}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name *</Label>
                    <Input 
                      id="firstName" 
                      value={formData.firstName}
                      onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input 
                      id="lastName"
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
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
  
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
  
                {!showMore ? (
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
                        value={formData.companyName}
                        onChange={(e) => setFormData(p => ({ ...p, companyName: e.target.value }))}
                      />
                    </div>
      
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input 
                        id="jobTitle" 
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
                  <Turnstile 
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                    onSuccess={(token) => setFormData(p => ({ ...p, turnstileToken: token }))}
                    options={{ theme: 'auto', size: 'compact' }}
                  />
                </div>
              </div>
            )}
          </div>"""


new_render = """          <div className="p-4 pb-0 max-h-[60vh] overflow-y-auto">
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

              {isSubmittingAsGuest && (
                <div className="flex justify-center pt-2">
                  <Turnstile 
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                    onSuccess={(token) => setFormData(p => ({ ...p, turnstileToken: token }))}
                    options={{ theme: 'auto', size: 'compact' }}
                  />
                </div>
              )}
            </div>
          </div>"""

content = content.replace(old_render, new_render)

# Ensure payload uses formData for logged in users as well
old_payload = """      const payload = !isSubmittingAsGuest 
        ? {
            type: 'tayz_profile',
            targetProfileId,
            sourceProfileId: selectedProfileId,
            sourceCardUid: cardUid,
            sourceChannel,
          }
        : {"""

new_payload = """      const payload = !isSubmittingAsGuest 
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
        : {"""

content = content.replace(old_payload, new_payload)


with open('src/components/profile/exchange-details-drawer.tsx', 'w') as f:
    f.write(content)
print('Updated exchange-details-drawer.tsx')
