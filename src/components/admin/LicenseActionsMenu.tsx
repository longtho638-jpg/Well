/**
 * License Actions Menu Component
 * Dropdown with suspend/unsuspend, change tier, revoke, view audit log actions
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LicenseTier, RaaSLicense } from '@/types/raas-license';

interface LicenseActionsMenuProps {
  license: RaaSLicense;
  onSuspend: (licenseId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  onUnsuspend: (licenseId: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateTier: (licenseId: string, tier: LicenseTier) => Promise<{ success: boolean; error?: string }>;
  onRevoke: (licenseId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  onViewAuditLog: (licenseId: string) => void;
}

export function LicenseActionsMenu({
  license,
  onSuspend,
  onUnsuspend,
  onUpdateTier,
  onRevoke,
  onViewAuditLog,
}: LicenseActionsMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState<
    | { type: 'suspend'; reason: string }
    | { type: 'revoke'; reason: string }
    | { type: 'tier'; tier: LicenseTier }
    | null
  >(null);

  const handleSuspend = async () => {
    if (!showModal || showModal.type !== 'suspend') return;
    const result = await onSuspend(license.id, showModal.reason);
    if (result.success) {
      setShowModal(null);
      setIsOpen(false);
    }
  };

  const handleUnsuspend = async () => {
    const result = await onUnsuspend(license.id);
    if (result.success) {
      setIsOpen(false);
    }
  };

  const handleRevoke = async () => {
    if (!showModal || showModal.type !== 'revoke') return;
    const result = await onRevoke(license.id, showModal.reason);
    if (result.success) {
      setShowModal(null);
      setIsOpen(false);
    }
  };

  const handleTierChange = async (tier: LicenseTier) => {
    const result = await onUpdateTier(license.id, tier);
    if (result.success) {
      setShowModal(null);
      setIsOpen(false);
    }
  };

  const isSuspended = license.status === 'suspended';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {isSuspended ? (
              <button
                onClick={handleUnsuspend}
                className="w-full px-4 py-2 text-left text-sm text-emerald-400 hover:bg-gray-800"
              >
                {t('admin.licenses.unsuspend')}
              </button>
            ) : (
              <button
                onClick={() => setShowModal({ type: 'suspend', reason: '' })}
                className="w-full px-4 py-2 text-left text-sm text-amber-400 hover:bg-gray-800"
              >
                {t('admin.licenses.suspend')}
              </button>
            )}

            <button
              onClick={() => setShowModal({ type: 'tier', tier: license.tier })}
              className="w-full px-4 py-2 text-left text-sm text-blue-400 hover:bg-gray-800"
            >
              {t('admin.licenses.change_tier')}
            </button>

            <button
              onClick={() => onViewAuditLog(license.id)}
              className="w-full px-4 py-2 text-left text-sm text-purple-400 hover:bg-gray-800"
            >
              {t('admin.licenses.view_audit_log')}
            </button>

            {license.status !== 'revoked' && (
              <button
                onClick={() => setShowModal({ type: 'revoke', reason: '' })}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-800"
              >
                {t('admin.licenses.revoke')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showModal?.type === 'suspend' && (
        <SuspendRevokeModal
          type="suspend"
          reason={showModal.reason}
          onReasonChange={(reason) => setShowModal({ type: 'suspend', reason })}
          onCancel={() => setShowModal(null)}
          onConfirm={handleSuspend}
          t={t}
        />
      )}

      {/* Revoke Modal */}
      {showModal?.type === 'revoke' && (
        <SuspendRevokeModal
          type="revoke"
          reason={showModal.reason}
          onReasonChange={(reason) => setShowModal({ type: 'revoke', reason })}
          onCancel={() => setShowModal(null)}
          onConfirm={handleRevoke}
          t={t}
        />
      )}

      {/* Tier Modal */}
      {showModal?.type === 'tier' && (
        <TierChangeModal
          currentTier={license.tier}
          onTierChange={handleTierChange}
          onCancel={() => setShowModal(null)}
          t={t}
        />
      )}
    </div>
  );
}

function SuspendRevokeModal({
  type,
  reason,
  onReasonChange,
  onCancel,
  onConfirm,
  t,
}: {
  type: 'suspend' | 'revoke';
  reason: string;
  onReasonChange: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">
          {type === 'suspend' ? t('admin.licenses.suspend_confirm') : t('admin.licenses.revoke_confirm')}
        </h3>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder={type === 'suspend' ? t('admin.licenses.suspend_reason_placeholder') : t('admin.licenses.revoke_reason_placeholder')}
          className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-3 mt-4 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">
            {t('admin.licenses.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason.trim()}
            className={`px-4 py-2 ${type === 'suspend' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50 disabled:cursor-not-allowed text-white rounded`}
          >
            {type === 'suspend' ? t('admin.licenses.suspend') : t('admin.licenses.revoke')}
          </button>
        </div>
      </div>
    </div>
  );
}

function TierChangeModal({
  currentTier,
  onTierChange,
  onCancel,
  t,
}: {
  currentTier: LicenseTier;
  onTierChange: (tier: LicenseTier) => Promise<void>;
  onCancel: () => void;
  t: (key: string) => string;
}) {
  const tiers: LicenseTier[] = ['basic', 'premium', 'enterprise', 'master'];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">{t('admin.licenses.change_tier')}</h3>
        <div className="space-y-2">
          {tiers.map((tier) => (
            <button
              key={tier}
              onClick={() => onTierChange(tier)}
              className={`w-full px-4 py-2 text-left rounded border ${currentTier === tier ? 'border-primary bg-primary/20 text-white' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
            >
              {t(`admin.licenses.${tier}`)}
            </button>
          ))}
        </div>
        <div className="flex gap-3 mt-4 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">
            {t('admin.licenses.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
