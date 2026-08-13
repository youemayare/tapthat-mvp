import type { Metadata } from 'next';
import LoginForm from './login-form';

export const metadata: Metadata = {
  title: 'Sign In | Anoya',
  description: 'Sign in to your Anoya account.',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; message?: string }>;
}) {
  return <LoginForm searchParams={searchParams} />;
}
