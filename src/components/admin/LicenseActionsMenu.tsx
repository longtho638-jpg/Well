/**
 * License Actions Menu Component
 * Dropdown with suspend/unsuspend, change tier, revoke, view audit log actions
 */

import { useState } from 'react';
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

  const handleUpdateTier = async () => {
    if (!showModal || showModal.type !== 'tier') return;
    const result = await onUpdateTier(license.id, showModal.tier);
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
                Unsuspend
              </button>
            ) : (
              <button
                onClick={() => setShowModal({ type: 'suspend', reason: '' })}
                className="w-full px-4 py-2 text-left text-sm text-amber-400 hover:bg-gray-800"
              >
                Suspend
              </button>
            )}

            <button
              onClick={() => setShowModal({ type: 'tier', tier: license.tier })}
              className="w-full px-4 py-2 text-left text-sm text-blue-400 hover:bg-gray-800"
            >
              Change Tier
            </button>

            <button
              onClick={() => onViewAuditLog(license.id)}
              className="w-full px-4 py-2 text-left text-sm text-purple-400 hover:bg-gray-800"
            >
              View Audit Log
            </button>

            {license.status !== 'revoked' && (
              <button
                onClick={() => setShowModal({ type: 'revoke', reason: '' })}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-800"
              >
                Revoke
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
        />
      )}

      {/* Tier Modal */}
      {showModal?.type === 'tier' && (
        <TierChangeModal
          currentTier={license.tier}
          onTierChange={(tier) => setShowModal({ type: 'tier', tier })}
          onCancel={() => setShowModal(null)}
          onConfirm={handleUpdateTier}
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
}: {
  type: 'suspend' | 'revoke';
  reason: string;
  onReasonChange: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">
          {type === 'suspend' ? 'Suspend License' : 'Revoke License'}
        </h3>
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder={`Enter ${type} reason...`}
          className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-3 mt-4 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason.trim()}
            className={`px-4 py-2 ${type === 'suspend' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50 disabled:cursor-not-allowed text-white rounded`}
          >
            {type === 'suspend' ? 'Suspend' : 'Revoke'}
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
}: {
  currentTier: LicenseTier;
  onTierChange: (tier: LicenseTier) => void;
  onCancel: () => void;
}) {
  const tiers: LicenseTier[] = ['basic', 'premium', 'enterprise', 'master'];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Change Tier</h3>
        <div className="space-y-2">
          {tiers.map((tier) => (
            <button
              key={tier}
              onClick={() => onTierChange(tier)}
              className={`w-full px-4 py-2 text-left rounded border ${currentTier === tier ? 'border-primary bg-primary/20 text-white' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}
            >
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-3 mt-4 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
