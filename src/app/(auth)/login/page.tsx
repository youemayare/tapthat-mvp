import type { Metadata } from 'next';
import LoginForm from './login-form';

export const metadata: Metadata = {
  title: 'Sign In | Tayz',
  description: 'Sign in to your Tayz account.',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; message?: string }>;
}) {
  return <LoginForm searchParams={searchParams} />;
}
