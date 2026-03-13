/**
 * RaaS License Audit Log Viewer
 */

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { LicenseAuditLog } from '@/types/raas-license';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface LicenseAuditLogViewerProps {
  licenseId?: string;
  limit?: number;
}

export function LicenseAuditLogViewer({ licenseId, limit = 50 }: LicenseAuditLogViewerProps) {
  const [logs, setLogs] = useState<LicenseAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('raas_license_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (licenseId) {
          query = query.eq('license_id', licenseId);
        }

        const { data, error } = await query;
        if (error) throw error;
        setLogs(data || []);
      } catch {
        // Error handled internally
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [licenseId, limit]);

  const getActionColor = (action: LicenseAuditLog['action']) => {
    const colors: Record<LicenseAuditLog['action'], string> = {
      created: 'text-blue-400',
      activated: 'text-emerald-400',
      expired: 'text-red-400',
      revoked: 'text-orange-400',
      updated: 'text-gray-400',
    };
    return colors[action];
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
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Audit Logs ({logs.length})
      </h3>
      <div className="space-y-2">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm">Không có audit logs</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                  {log.action === 'created' && 'Tạo mới'}
                  {log.action === 'activated' && 'Kích hoạt'}
                  {log.action === 'expired' && 'Hết hạn'}
                  {log.action === 'revoked' && 'Thu hồi'}
                  {log.action === 'updated' && 'Cập nhật'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(log.created_at)}
                </span>
              </div>
              {(log.old_status || log.new_status) && (
                <div className="mt-2 text-xs text-gray-400">
                  {log.old_status && (
                    <span>
                      Trạng thái cũ: <code className="text-gray-300">{log.old_status}</code>
                    </span>
                  )}
                  {log.old_status && log.new_status && ' → '}
                  {log.new_status && (
                    <span>
                      Trạng thái mới: <code className="text-gray-300">{log.new_status}</code>
                    </span>
                  )}
                </div>
              )}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">
                    Chi tiết metadata
                  </summary>
                  <pre className="mt-1 text-xs text-gray-400 overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
