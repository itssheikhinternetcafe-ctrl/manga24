import React, { useState } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { verifyAdminClaim } from '../../services/admin';

export const AdminLoginForm: React.FC = () => {
  const { loginWithEmail } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await loginWithEmail(email.trim(), password);
      if (!(await verifyAdminClaim())) throw new Error('This account is not authorized for the admin console.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto flex min-h-[65vh] max-w-md items-center px-4">
    <form onSubmit={submit} className="w-full rounded-2xl border border-[#2C2340] bg-[#171122] p-7 shadow-2xl">
      <div className="mb-6 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF4D6D]/15 text-[#FF4D6D]"><ShieldCheck /></div><div><h1 className="font-heading text-xl font-black">Admin sign in</h1><p className="text-xs text-[#A79FC0]">Manhwa24 control center</p></div></div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}
      <label className="mb-1 block text-xs font-semibold text-[#A79FC0]">Email address</label>
      <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mb-4 w-full rounded-lg border border-[#3A294A] bg-[#0E0A14] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF4D6D]" />
      <label className="mb-1 block text-xs font-semibold text-[#A79FC0]">Password</label>
      <div className="relative"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-[#A79FC0]" /><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-[#3A294A] bg-[#0E0A14] py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-[#FF4D6D]" /></div>
      <button disabled={busy} className="mt-6 w-full rounded-lg bg-[#FF4D6D] py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Signing in...' : 'Sign in securely'}</button>
    </form>
  </div>;
};
