// src/app/(auth)/signup/page.tsx
// Signup page — invite-only. Reads invite token from searchParams.
// Without a token → shows "Invite Required" message.
// With a token → renders SignupForm to complete the invite flow.

import Link from 'next/link';
import SignupForm from './SignupForm';

// Next.js 15+ requires searchParams to be awaited as a Promise.
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-[--re-text-primary]">
          Invite Required
        </h1>
        <p className="mt-3 mb-6 text-[--re-text-muted]">
          RemixEngine is an invite-only tool. Ask an admin to send you an invite.
        </p>
        <Link href="/login" className="text-[--re-accent-primary] hover:underline text-sm">
          Back to sign in
        </Link>
      </div>
    );
  }

  return <SignupForm token={token} />;
}
