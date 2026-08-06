import type { Metadata } from 'next';
import SignupForm from './signup-form';

export const metadata: Metadata = {
  title: 'Create Account | TapThat',
  description: 'Create your TapThat account and set up your professional profile.',
};

interface Props {
  searchParams: Promise<{ redirectTo?: string; message?: string }>;
}

export default function SignupPage({ searchParams }: Props) {
  return <SignupForm searchParams={searchParams} />;
}
