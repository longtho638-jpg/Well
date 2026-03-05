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
import { raas } from './vi/raas';
import { agent } from './vi/agent';
import { app } from './vi/app';
import { commissionwallet } from './vi/commissionwallet';
import { copilotcoaching } from './vi/copilotcoaching';
import { copilotheader } from './vi/copilotheader';
import { copilotmessageitem } from './vi/copilotmessageitem';
import { copilotsuggestions } from './vi/copilotsuggestions';
import { achievementgrid } from './vi/achievementgrid';
import { herocard } from './vi/herocard';
import { dailyquesthub } from './vi/dailyquesthub';
import { liveActivities, liveactivitiesticker, quickactionscard, recentactivitylist, revenuebreakdown, revenuechart } from './vi/dashboard-additional';

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
  ...raas,
  ...agent,
  ...app,
  ...commissionwallet,
  ...copilotcoaching,
  ...copilotheader,
  ...copilotmessageitem,
  ...copilotsuggestions,
  ...achievementgrid,
  ...herocard,
  ...dailyquesthub,
  ...liveActivities,
  ...liveactivitiesticker,
  ...quickactionscard,
  ...recentactivitylist,
  ...revenuebreakdown,
  ...revenuechart,
};
