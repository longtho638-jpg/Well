/**
 * WellNexus API Hub
 * Backward compatible facade for domain-specific services.
 * 
 * DEPRECATED: Import from specific services directly in new code.
 */

import { userService } from './userService';
import { walletService } from './walletService';
import { productService } from './productService';
import { questService } from './questService';
import { analyticsService } from './analyticsService';

export const userAPI = userService;
export const walletAPI = walletService;
export const productAPI = productService;
export const questAPI = questService;
export const analyticsAPI = analyticsService;

// Facade for order operations (DEPRECATED - use orderService directly)

export default {
  user: userAPI,
  wallet: walletAPI,
  product: productAPI,
  quest: questAPI,
  analytics: analyticsAPI,
};
