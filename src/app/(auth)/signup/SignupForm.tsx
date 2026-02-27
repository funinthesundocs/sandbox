'use client';

// src/app/(auth)/signup/SignupForm.tsx
// Client component — accepts invite token and completes Supabase invite flow.
// Flow: verifyOtp (establishes session) → updateUser (sets password + full_name) → redirect.

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SignupFormProps {
  token: string;
}

export default function SignupForm({ token }: SignupFormProps) {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    const supabase = createClient();

    // Step 1: Exchange the invite token for a session.
    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'invite',
    });

    if (otpError) {
      setError(otpError.message);
      setLoading(false);
      return;
    }

    // Step 2: Set the user's password and full name.
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { full_name: fullName },
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Hard redirect so middleware session refresh runs on next request.
    window.location.href = '/dashboard';
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[--re-text-primary]">
        Complete your account
      </h1>
      <p className="text-sm mt-1 mb-6 text-[--re-text-muted]">
        You&apos;ve been invited to RemixEngine. Set up your account below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-[--re-text-secondary]">
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className="bg-[--re-bg-input] border-[--re-border] text-[--re-text-primary] placeholder:text-[--re-text-muted] focus:border-[--re-accent-primary]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[--re-text-secondary]">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="bg-[--re-bg-input] border-[--re-border] text-[--re-text-primary] placeholder:text-[--re-text-muted] focus:border-[--re-accent-primary]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-[--re-text-secondary]">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            className="bg-[--re-bg-input] border-[--re-border] text-[--re-text-primary] placeholder:text-[--re-text-muted] focus:border-[--re-accent-primary]"
          />
        </div>

        {error && (
          <div className="text-sm text-[--re-destructive]">{error}</div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[--re-accent-primary] text-[--re-text-inverse] hover:bg-[--re-accent-secondary]"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </div>
  );
}
