/**
 * RaaS License List Component
 * Admin dashboard table view for license management
 */

import React, { useState } from 'react';
import { useRaasLicenses } from '@/hooks/use-raas-licenses';
import type { LicenseStatus } from '@/types/raas-license';
import { STATUS_COLORS } from '@/types/raas-license';

interface LicenseListProps {
  onRevoke?: () => void;
  onActivate?: (licenseId: string) => void;
}

export function LicenseList({ onRevoke, onActivate }: LicenseListProps) {
  const {
    licenses,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    revokeLicense,
    activateLicense,
  } = useRaasLicenses();

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const handleRevoke = async (licenseId: string) => {
    if (!revokeReason.trim()) return;
    const result = await revokeLicense(licenseId, revokeReason);
    if (result.success) {
      setRevokingId(null);
      setRevokeReason('');
      onRevoke?.();
    }
  };

  const handleActivate = async (licenseId: string) => {
    const result = await activateLicense(licenseId);
    if (result.success) {
      onActivate?.(licenseId);
    }
  };

  const formatStatus = (status: LicenseStatus) => {
    const labels: Record<LicenseStatus, string> = {
      active: 'Hoạt động',
      expired: 'Hết hạn',
      revoked: 'Thu hồi',
      pending: 'Chờ duyệt',
    };
    return labels[status];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
        Lỗi: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'expired', 'revoked', 'pending'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              statusFilter === status
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {status === 'all' ? 'Tất cả' : formatStatus(status)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-gray-400">License Key</th>
              <th className="px-4 py-3 text-left text-gray-400">User</th>
              <th className="px-4 py-3 text-left text-gray-400">Status</th>
              <th className="px-4 py-3 text-left text-gray-400">Created</th>
              <th className="px-4 py-3 text-left text-gray-400">Expires</th>
              <th className="px-4 py-3 text-left text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {licenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Không có license nào
                </td>
              </tr>
            ) : (
              licenses.map((license) => (
                <tr key={license.id} className="hover:bg-gray-900/50">
                  <td className="px-4 py-3 font-mono text-xs">
                    {license.license_key}
                  </td>
                  <td className="px-4 py-3">
                    {'users' in license && license.users ? (
                      <div>
                        <div className="text-white">{(license.users as { email?: string }).email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs border ${STATUS_COLORS[license.status]}`}
                    >
                      {formatStatus(license.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {formatDate(license.created_at)}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {formatDate(license.expires_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {license.status === 'pending' && (
                        <button
                          onClick={() => handleActivate(license.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs"
                        >
                          Kích hoạt
                        </button>
                      )}
                      {license.status !== 'revoked' && (
                        <button
                          onClick={() => setRevokingId(license.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                        >
                          Thu hồi
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Revoke Modal */}
      {revokingId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Xác nhận thu hồi license</h3>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Nhập lý do thu hồi..."
              className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => {
                  setRevokingId(null);
                  setRevokeReason('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={() => handleRevoke(revokingId, revokeReason)}
                disabled={!revokeReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded"
              >
                Thu hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
