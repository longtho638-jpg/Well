/**
 * Create License Modal
 */

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface CreateLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateLicenseModal({ isOpen, onClose, onSuccess }: CreateLicenseModalProps) {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Find user by email if provided
      let finalUserId = userId;
      if (email && !userId) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single();
        if (userData) {
          finalUserId = userData.id;
        } else {
          throw new Error('Không tìm thấy user với email: ' + email);
        }
      }

      if (!finalUserId) {
        throw new Error('Yêu cầu userId hoặc email');
      }

      if (!expiresAt) {
        throw new Error('Yêu cầu ngày hết hạn');
      }

      // Generate license key
      const timestamp = Math.floor(Date.now() / 1000);
      const hashStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const licenseKey = `RAAS-${timestamp}-${hashStr}`;

      // Create license
      const { error: createError } = await supabase
        .from('raas_licenses')
        .insert({
          license_key: licenseKey,
          user_id: finalUserId,
          status: 'active',
          features: {
            adminDashboard: true,
            payosWebhook: true,
            commissionDistribution: true,
            policyEngine: true,
          },
          expires_at: expiresAt,
          metadata: { created_via: 'admin_dashboard' },
        })
        .select()
        .single();

      if (createError) throw createError;

      setCreatedKey(licenseKey);
      onSuccess?.();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-lg w-full mx-4">
        <h2 className="text-xl font-semibold text-white mb-6">Tạo License Mới</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="user-input" className="block text-sm text-gray-400 mb-1">User ID (hoặc Email)</label>
            <input
              id="user-input" type="text"
              value={userId || email}
              onChange={(e) => {
                setUserId('');
                setEmail(e.target.value);
              }}
              placeholder="Nhập email user"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="expires-input" className="block text-sm text-gray-400 mb-1">Ngày hết hạn</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {createdKey && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded">
              <p className="text-emerald-400 text-sm font-medium mb-2">
                ✅ License đã tạo thành công!
              </p>
              <div className="p-2 bg-gray-800 rounded font-mono text-xs text-emerald-300 break-all">
                {createdKey}
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Sao chép key này và gửi cho user
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={loading || !!createdKey}
              className="px-4 py-2 bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded"
            >
              {loading ? 'Đang tạo...' : createdKey ? 'Đã tạo' : 'Tạo License'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
