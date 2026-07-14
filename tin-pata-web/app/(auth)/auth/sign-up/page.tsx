'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AuthCard } from '@/components/auth/AuthCard';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthFooter } from '@/components/auth/AuthFooter';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthSuccessBanner } from '@/components/auth/AuthSuccessBanner';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { AuthService } from '@/services/AuthService';
import { ROUTES } from '@/utils/constants';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await AuthService.signUp(email, password, confirmPassword);
      if (result.needsEmailConfirmation) {
        setSuccess('Account created. Check your email to confirm, then sign in.');
        return;
      }
      setSuccess('Account created. Redirecting…');
      router.replace(ROUTES.dashboard);
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
        title="Sign up"
        subtitle="Create an account to sync with Tin Pata on Android."
      />
      <AuthForm onSubmit={(e) => void handleSubmit(e)}>
        <AuthErrorBanner message={error} />
        <AuthSuccessBanner message={success} />
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account…' : 'Sign up'}
        </Button>
      </AuthForm>
      <AuthFooter>
        Already have an account?{' '}
        <Link href={ROUTES.signIn} className="font-medium text-tint hover:underline">
          Sign in
        </Link>
      </AuthFooter>
    </AuthCard>
  );
}
