'use client';

import Link from 'next/link';
import { useState } from 'react';

import { AuthCard } from '@/components/auth/AuthCard';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthFooter } from '@/components/auth/AuthFooter';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthSuccessBanner } from '@/components/auth/AuthSuccessBanner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { AuthService } from '@/services/AuthService';
import { ROUTES } from '@/utils/constants';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await AuthService.forgotPassword(email);
      setSuccess('If that email is registered, a reset link is on its way. Check your inbox.');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Forgot password"
        subtitle="We’ll email you a link to reset your password."
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
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </AuthForm>
      <AuthFooter>
        <Link href={ROUTES.signIn} className="font-medium text-tint hover:underline">
          Back to sign in
        </Link>
      </AuthFooter>
    </AuthCard>
  );
}
