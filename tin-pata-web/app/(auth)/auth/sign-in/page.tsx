'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { AuthCard } from '@/components/auth/AuthCard';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthFooter } from '@/components/auth/AuthFooter';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { LoadingScreen } from '@/components/auth/LoadingScreen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { AuthService } from '@/services/AuthService';
import { ROUTES } from '@/utils/constants';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || ROUTES.dashboard;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await AuthService.signIn(email, password);
      router.replace(redirectTo.startsWith('/') ? redirectTo : ROUTES.dashboard);
      router.refresh();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Sign in"
        subtitle="Use the same account as Tin Pata on Android."
      />
      <AuthForm onSubmit={(e) => void handleSubmit(e)}>
        <AuthErrorBanner message={error} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="text-right">
          <Link href={ROUTES.forgotPassword} className="text-sm text-tint hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </AuthForm>
      <AuthFooter>
        Don&apos;t have an account?{' '}
        <Link href={ROUTES.signUp} className="font-medium text-tint hover:underline">
          Sign up
        </Link>
      </AuthFooter>
    </AuthCard>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SignInForm />
    </Suspense>
  );
}
