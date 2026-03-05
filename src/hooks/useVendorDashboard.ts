/**
 * Vendor Dashboard Hook
 * Handles product management logic for vendor dashboard
 */

import { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../store';
import { productService } from '../services/productService';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../hooks';
import { checkRateLimit, getRateLimitRemaining, logAuditEvent, isUserVendor } from '../utils/auth';
import { createLogger } from '../utils/logger';

const logger = createLogger('VendorDashboard');

export const useVendorDashboard = (vendorId: string) => {
  const { user } = useStore();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number>(100);

  // Check rate limit before any API call
  const checkRateLimitAndNotify = () => {
    if (!user?.id) return true;

    const exceeded = checkRateLimit(user.id);
    setRateLimitRemaining(getRateLimitRemaining(user.id));

    if (exceeded) {
      showToast(t('vendor.toasts.rateLimitExceeded'), 'error');
      return false;
    }
    return true;
  };

  // Verify user is authorized vendor
  const verifyVendorAuthorization = async (): Promise<boolean> => {
    if (!user?.id) {
      showToast(t('vendor.errors.notLoggedIn'), 'error');
      return false;
    }

    const isVendor = await isUserVendor(user.id);
    if (!isVendor) {
      showToast(t('vendor.errors.vendorOnly'), 'error');
      return false;
    }

    if (user.id !== vendorId) {
      logAuditEvent(user.id, 'UNAUTHORIZED_ACCESS', 'vendor_dashboard', vendorId);
      showToast(t('vendor.errors.accessDenied'), 'error');
      return false;
    }

    return true;
  };

  const loadProducts = async () => {
    if (!checkRateLimitAndNotify()) {
      setLoading(false);
      return [];
    }
    if (!await verifyVendorAuthorization()) {
      setLoading(false);
      return [];
    }

    setLoading(true);
    try {
      const vendorProductsList = await productService.getVendorProducts(vendorId);
      const convertedProducts: Product[] = vendorProductsList.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        commissionRate: product.commission_rate || 0.21,
        imageUrl: product.image_url || '',
        description: product.description,
        salesCount: product.sales_count || 0,
        stock: product.stock || 0,
        bonusRevenue: product.bonus_revenue,
        vendorId: product.vendor_id
      }));
      return convertedProducts;
    } catch (error) {
      logger.error('Error loading vendor products', { error: error instanceof Error ? error.message : String(error) });
      showToast(t('vendor.toasts.loadError'), 'error');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (newProduct: Omit<Product, 'id'>) => {
    if (!checkRateLimitAndNotify()) return;
    if (!await verifyVendorAuthorization()) return;

    try {
      await productService.createProductForVendor({
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        bonus_revenue: Math.floor(newProduct.price * 0.15),
        stock: newProduct.stock || 10,
        image_url: newProduct.imageUrl,
        category: 'health'
      }, vendorId);

      await useStore.getState().fetchProducts();
      showToast(t('vendor.toasts.saveSuccess'), 'success');
      setShowAddProduct(false);
    } catch (error) {
      logger.error('Error adding product', { error: error instanceof Error ? error.message : String(error) });
      showToast(t('vendor.toasts.addError'), 'error');
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    if (!checkRateLimitAndNotify()) return;
    if (!await verifyVendorAuthorization()) return;

    try {
      await productService.updateProduct(id, {
        name: updates.name,
        description: updates.description,
        price: updates.price,
        stock: updates.stock,
        image_url: updates.imageUrl,
        commission_rate: updates.commissionRate
      }, vendorId);

      await useStore.getState().fetchProducts();
      showToast(t('vendor.toasts.saveSuccess'), 'success');
    } catch (error) {
      logger.error('Error updating product', { error: error instanceof Error ? error.message : String(error) });
      showToast(t('vendor.toasts.updateError'), 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!checkRateLimitAndNotify()) return;
    if (!await verifyVendorAuthorization()) return;

    if (!window.confirm(t('vendor.dashboard.products.deleteConfirm'))) {
      return;
    }

    try {
      await productService.deleteProduct(id, vendorId);
      await useStore.getState().fetchProducts();
      showToast(t('vendor.toasts.saveSuccess'), 'success');
    } catch (error) {
      logger.error('Error deleting product', { error: error instanceof Error ? error.message : String(error) });
      showToast(t('vendor.toasts.deleteError'), 'error');
    }
  };

  return {
    loading,
    showAddProduct,
    setShowAddProduct,
    loadProducts,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct
  };
};
