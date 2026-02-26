import { admin } from './vi/admin';
import { auth } from './vi/auth';
import { common } from './vi/common';
import { copilot } from './vi/copilot';
import { dashboard } from './vi/dashboard';
import { health } from './vi/health';
import { marketing } from './vi/marketing';
import { marketplace } from './vi/marketplace';
import { referral } from './vi/referral';
import { team } from './vi/team';
import { wallet } from './vi/wallet';
import { network } from './vi/network';
import { misc } from './vi/misc';

export const vi = {
  ...admin,
  ...auth,
  ...common,
  ...copilot,
  ...dashboard,
  ...health,
  ...marketing,
  ...marketplace,
  ...referral,
  ...team,
  ...wallet,
  ...network,
  ...misc,
};
