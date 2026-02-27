'use client';

// src/app/(auth)/login/page.tsx
// Login page — email/password auth via Supabase signInWithPassword.
// Hard redirect to /dashboard on success so middleware cookie refresh runs.

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Hard redirect so the middleware cookie refresh runs on the next request.
    window.location.href = '/dashboard';
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[--re-text-primary]">
        Sign in to RemixEngine
      </h1>
      <p className="text-sm mt-1 mb-6 text-[--re-text-muted]">
        Internal tool — invite only
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[--re-text-secondary]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
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
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-[--re-text-muted]">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[--re-accent-primary] hover:underline">
          Request access
        </Link>
      </p>
    </div>
  );
}
