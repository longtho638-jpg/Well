import * as client from './client';
import * as admin from './admin';
import * as stats from './stats';

export const withdrawalService = {
  ...client,
  ...admin,
  ...stats,
};

export default withdrawalService;
export * from './types';
