/**
 * RaaS License Management Admin Page
 */

import React, { useState } from 'react';
import { LicenseList } from '@/components/admin/LicenseList';
import { LicenseAuditLogViewer } from '@/components/admin/LicenseAuditLogViewer';
import { CreateLicenseModal } from '@/components/admin/CreateLicenseModal';

export default function LicensesAdminPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý License RaaS</h1>
          <p className="text-gray-400 text-sm mt-1">
            Quản lý license keys, kích hoạt, thu hồi và xem audit logs
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium"
        >
          + Tạo License
        </button>
      </div>

      {/* Main Content */}
      <div className="grid gap-6">
        {/* License List */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Danh sách License</h2>
          <LicenseList
            onRevoke={() => {}}
            onActivate={() => {}}
          />
        </div>

        {/* Audit Log Viewer */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <LicenseAuditLogViewer />
        </div>
      </div>

      {/* Create Modal */}
      <CreateLicenseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
