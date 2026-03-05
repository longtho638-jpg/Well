/**
 * Vendor Dashboard Settings Tab
 * Allows vendors to customize their storefront
 */

import React from 'react';
import { useTranslation } from '../../hooks';

interface VendorDashboardSettingsProps {
  vendorName?: string;
}

export const VendorDashboardSettings: React.FC<VendorDashboardSettingsProps> = ({ vendorName }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-xl">
      <h4 className="font-medium text-gray-900 dark:text-white mb-4">
        {t('vendor.settings.subtitle')}
      </h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('vendor.settings.storeName')}
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
            defaultValue={vendorName || ''}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('vendor.settings.storeDescription')}
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
            rows={4}
            defaultValue={t('vendor.settings.defaultDescription')}
          ></textarea>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          {t('vendor.settings.saveButton')}
        </button>
      </div>
    </div>
  );
};
