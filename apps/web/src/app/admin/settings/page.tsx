'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { KeyRound, User, Shield, Check } from 'lucide-react';

export default function AdminSettings() {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const changePassword = async () => {
    setMessage('');
    if (!newPassword || newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      setMessageType('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setMessage(error.message);
        setMessageType('error');
        return;
      }

      setMessage('Password changed successfully');
      setMessageType('success');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMessage('Failed to change password');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Settings</h1>
        <p className="text-sm text-white/35">Account and security settings</p>
      </div>

      <div className="admin-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/6">
          <div className="w-10 h-10 rounded-lg bg-aim-gold/10 flex items-center justify-center">
            <User className="w-5 h-5 text-aim-gold" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Account</div>
            <div className="text-xs text-white/35">{user?.email}</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400">Admin</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-white/35">User ID</span>
            <div className="text-white/60 font-mono mt-0.5">{user?.id?.slice(0, 16)}...</div>
          </div>
          <div>
            <span className="text-white/35">Created</span>
            <div className="text-white/60 mt-0.5">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US') : '–'}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-aim-gold/10 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-aim-gold" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Change Password</div>
            <div className="text-xs text-white/35">Set a new password</div>
          </div>
        </div>

        {message && (
          <div className={`text-sm px-4 py-3 rounded-lg border mb-5 flex items-center gap-2 ${
            messageType === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {messageType === 'success' && <Check className="w-4 h-4" />}
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block font-medium">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full admin-input rounded-lg px-3 py-2.5 text-sm"
              placeholder="At least 6 characters"
              minLength={6}
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block font-medium">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full admin-input rounded-lg px-3 py-2.5 text-sm"
              placeholder="Enter again"
            />
          </div>
          <button
            onClick={changePassword}
            disabled={loading || !newPassword}
            className="px-5 py-2.5 rounded-lg bg-aim-gold text-deep-space text-xs font-bold hover:bg-aim-gold-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
