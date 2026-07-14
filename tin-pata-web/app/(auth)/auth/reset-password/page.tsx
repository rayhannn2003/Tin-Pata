'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AuthCard } from '@/components/auth/AuthCard';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthFooter } from '@/components/auth/AuthFooter';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthSuccessBanner } from '@/components/auth/AuthSuccessBanner';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { LoadingScreen } from '@/components/auth/LoadingScreen';
import { Button } from '@/components/ui/Button';
import { AuthError, getAuthErrorMessage } from '@/lib/auth/errors';
import { createClient } from '@/lib/supabase/client';
import { AuthService } from '@/services/AuthService';
import { ROUTES } from '@/utils/constants';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const client = createClient();

    void (async () => {
      if (!client) {
        if (active) {
          setError(getAuthErrorMessage(new AuthError('not_configured')));
          setReady(true);
        }
        return;
      }

      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
          url.searchParams.delete('code');
          window.history.replaceState({}, '', url.pathname);
        }

        const { data } = await client.auth.getSession();
        if (!active) {
          return;
        }
        if (!data.session) {
          setError(getAuthErrorMessage(new AuthError('reset_link_expired')));
        }
      } catch {
        if (active) {
          setError(getAuthErrorMessage(new AuthError('reset_link_expired')));
        }
      } finally {
        if (active) {
          setReady(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await AuthService.resetPassword(password, confirmPassword);
      setSuccess('Password updated. Redirecting to sign in…');
      setTimeout(() => {
        void AuthService.signOut().finally(() => {
          router.replace(ROUTES.signIn);
          router.refresh();
        });
      }, 1200);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return <LoadingScreen label="Checking reset link…" />;
  }

  return (
    <AuthCard>
      <AuthHeader title="Reset password" subtitle="Choose a new password for your account." />
      <AuthForm onSubmit={(e) => void handleSubmit(e)}>
        <AuthErrorBanner message={error} />
        <AuthSuccessBanner message={success} />
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading || Boolean(success)} className="w-full">
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </AuthForm>
      <AuthFooter>
        <Link href={ROUTES.forgotPassword} className="font-medium text-tint hover:underline">
          Request a new link
        </Link>
      </AuthFooter>
    </AuthCard>
  );
}
