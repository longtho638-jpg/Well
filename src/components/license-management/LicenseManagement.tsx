/**
 * License Management Page
 * Manages extension eligibility and status display
 */

import React, { useEffect, useState } from 'react';
import { ExtensionStatus, type ExtensionStatusType } from './ExtensionStatus';

interface ExtensionData {
  permitted: boolean;
  status: ExtensionStatusType;
  usage: number;
  limit: number;
  resetAt: string | null;
}

interface LicenseManagementResponse {
  tenant_id: string;
  extensions: {
    'algo-trader': ExtensionData;
  };
}

export const LicenseManagement: React.FC = () => {
  const [extensionStatus, setExtensionStatus] = useState<ExtensionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExtensionStatus = async () => {
      try {
        // Get auth token from localStorage or session
        const token = localStorage.getItem('auth_token') ||
                      sessionStorage.getItem('auth_token');

        if (!token) {
          setError('Chưa đăng nhập');
          setLoading(false);
          return;
        }

        const response = await fetch('https://raas.agencyos.network/v1/extension/status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('Phiên đăng nhập hết hạn');
          } else if (response.status === 403) {
            setError('Không có quyền truy cập');
          } else {
            setError(`Lỗi: ${response.status}`);
          }
          setLoading(false);
          return;
        }

        const data: LicenseManagementResponse = await response.json();
        setExtensionStatus(data.extensions['algo-trader']);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch extension status:', err);
        setError('Không thể kết nối đến máy chủ');
        setLoading(false);
      }
    };

    fetchExtensionStatus();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <span className="ml-3 text-zinc-400">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Quản lý Giấy phép</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Xem trạng thái gia hạn và giới hạn sử dụng extension
        </p>
      </div>

      {/* Extension Status */}
      {extensionStatus && (
        <ExtensionStatus
          extension="algo-trader"
          permitted={extensionStatus.permitted}
          status={extensionStatus.status}
          usage={extensionStatus.usage}
          limit={extensionStatus.limit}
          resetAt={extensionStatus.resetAt}
        />
      )}

      {/* Help Section */}
      <div className="mt-6 p-4 rounded-lg bg-zinc-800/50 border border-white/10">
        <h4 className="text-sm font-semibold text-white mb-2">Cần trợ giúp?</h4>
        <ul className="text-sm text-zinc-400 space-y-1">
          <li>• Extension Algo Trader yêu cầu gói Pro hoặc Enterprise</li>
          <li>• Giới hạn làm mới mỗi 24 giờ</li>
          <li>• Liên hệ support@agencyos.network để nâng cấp</li>
        </ul>
      </div>
    </div>
  );
};
