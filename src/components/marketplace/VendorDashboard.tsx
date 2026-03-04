/**
 * Vendor Dashboard Component
 * Allows partners/distributors to manage their product listings, track sales, and customize their storefront
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, BarChart3, TrendingUp, ShoppingCart, DollarSign, Edit3, Plus, Trash2 } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../store';
import { useVendorDashboard } from '../../hooks/useVendorDashboard';
import { useTranslation } from '../../hooks';
import { VendorAnalytics } from './VendorAnalytics';
import { AddProductModal } from './VendorDashboardModal';

interface VendorDashboardProps {
  vendorId: string;
  className?: string;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({ vendorId, className }) => {
  const { user } = useStore();
  const { t } = useTranslation();
  const {
    loading,
    showAddProduct,
    setShowAddProduct,
    loadProducts,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct
  } = useVendorDashboard(vendorId);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'settings'>('products');

  // Initialize vendor products
  useEffect(() => {
    loadProducts().then(setVendorProducts);
  }, [vendorId]);

  const totalSales = vendorProducts.reduce((sum, product) => sum + (product.salesCount * product.price), 0);
  const totalProducts = vendorProducts.length;
  const totalCommissions = vendorProducts.reduce((sum, product) => sum + (product.salesCount * product.price * (product.commissionRate || 0)), 0);

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('vendor.dashboard.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('vendor.dashboard.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('vendor.dashboard.stats.totalSales')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalSales.toLocaleString()}₫
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 border border-green-200 dark:border-green-800/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">{t('vendor.dashboard.stats.products')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
            </div>
            <Package className="h-8 w-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-6 border border-purple-200 dark:border-purple-800/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{t('vendor.dashboard.stats.commissions')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalCommissions.toLocaleString()}₫
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-6 border border-orange-200 dark:border-orange-800/50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">{t('vendor.dashboard.stats.orders')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {vendorProducts.reduce((sum, product) => sum + product.salesCount, 0)}
              </p>
            </div>
            <ShoppingCart className="h-8 w-8 text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t('vendor.dashboard.tabs.products')}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('vendor.dashboard.tabs.analytics')}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              {t('vendor.dashboard.tabs.settings')}
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'products' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('vendor.dashboard.products.title')}
            </h3>
            <button
              onClick={() => setShowAddProduct(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('vendor.dashboard.products.addProduct')}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {t('vendor.dashboard.products.loading')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendorProducts.map((product) => (
                <div key={product.id} className="relative group border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-zinc-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900 dark:text-white truncate">{product.name}</h4>
                    <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(product.commissionRate * 100)}% {t('vendor.dashboard.products.commission')}
                    </div>
                  </div>

                  <div className="mb-3 h-32 bg-gray-100 dark:bg-zinc-700 rounded-md overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {product.price.toLocaleString()}₫
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {product.description}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span>{t('vendor.dashboard.products.sales')}: {product.salesCount}</span>
                    <span className="ml-2">{t('vendor.dashboard.products.stock')}: {product.stock}</span>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleUpdateProduct(product.id, product)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm transition-colors"
                      title={t('vendor.dashboard.products.edit')}
                    >
                      <Edit3 className="h-3 w-3 inline mr-1" />
                      {t('vendor.dashboard.products.edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm transition-colors"
                      title={t('vendor.dashboard.products.delete')}
                    >
                      <Trash2 className="h-3 w-3 inline mr-1" />
                      {t('vendor.dashboard.products.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showAddProduct && (
            <AddProductModal
              onClose={() => setShowAddProduct(false)}
              onAdd={handleAddProduct}
            />
          )}
        </motion.div>
      )}

      {activeTab === 'analytics' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('vendor.analytics.title')}
          </h3>
          <VendorAnalytics vendorId={vendorId} />
        </motion.div>
      )}

      {activeTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('vendor.settings.title')}
          </h3>
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
                  defaultValue={user?.name || ''}
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
        </motion.div>
      )}
    </div>
  );
};
