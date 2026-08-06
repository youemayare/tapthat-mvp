import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Cards' };

export default function CardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Cards</h1>
        <p className="text-muted-foreground mt-1">Manage your NFC cards — register, activate, or deactivate them here.</p>
      </div>
      <div className="bg-card text-card-foreground border border-border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">Card management coming in Week 6. 💳</p>
      </div>
    </div>
  );
}
