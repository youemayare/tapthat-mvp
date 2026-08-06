import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account, email, and password.</p>
      </div>
      <div className="bg-card text-card-foreground border border-border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">Account settings coming soon. ⚙️</p>
      </div>
    </div>
  );
}
