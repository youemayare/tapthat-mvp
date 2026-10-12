import { redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/admin/auth';
import { AdminLoginForm } from './admin-login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hardware Admin Login | Tayz',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await verifyAdminSession();
  if (session.authenticated) {
    redirect('/admin/inventory');
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden transition-colors selection:bg-[#0071e3]/30">
      {/* Subtle brand glow matching dashboard aesthetic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-brand-500/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full relative z-10">
        <AdminLoginForm />
      </div>
    </div>
  );
}
