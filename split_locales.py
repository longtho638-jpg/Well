import os
import re

def split_vi_ts(file_path, output_dir):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the main object content
    match = re.search(r'export const vi = \{(.*)\};', content, re.DOTALL)
    if not match:
        print("Could not find vi object")
        return

    main_content = match.group(1)

    # Split by top-level keys
    # Pattern: \n  key: { ... \n  },
    # This is tricky because of nested braces.

    keys = {}
    current_key = None
    buffer = []
    brace_count = 0

    lines = main_content.split('\n')
    for line in lines:
        if brace_count == 0:
            key_match = re.match(r'^\s\s([a-zA-Z0-9_]+):\s\{', line)
            if key_match:
                current_key = key_match.group(1)
                buffer = [line]
                brace_count = 1
                continue

        if current_key:
            buffer.append(line)
            brace_count += line.count('{')
            brace_count -= line.count('}')

            if brace_count == 0:
                # Remove trailing comma if exists to avoid double commas when joining
                block = '\n'.join(buffer).strip()
                if block.endswith(','):
                    block = block[:-1]
                keys[current_key] = block
                current_key = None
                buffer = []

    # Define groups
    groups = {
        'common': ['pwa', 'common', 'nav', 'errors', 'success', 'errorboundary', 'button', 'sidebar', 'notification', 'notfound', 'app', 'patterns', 'notificationcenter'],
        'auth': ['auth', 'signup', 'signupform', 'loginactivitylog', 'sessionmanager', 'profilepage'],
        'dashboard': ['dashboard', 'overview', 'statsgrid', 'useStatsGrid', 'quickactionscard', 'herocard', 'useHeroCard', 'heroenhancements', 'recentactivitylist', 'liveActivities', 'liveactivitiesticker', 'liveconsole'],
        'wallet': ['wallet', 'commissionwallet', 'commissionsection', 'withdrawal', 'withdrawalmodal', 'transactioncard', 'finance', 'revenuebreakdown', 'revenuechart', 'revenueprogresswidget'],
        'marketplace': ['marketplace', 'marketplaceheader', 'marketplacefilters', 'products', 'productcard', 'productgrid', 'producthero', 'productinfo', 'productdetail', 'productpricing', 'producttabs', 'productactions', 'topproducts', 'cart', 'cartdrawer', 'checkout', 'orderimagemodal', 'ordertable', 'ordermanagement', 'redemptionzone'],
        'team': ['team', 'teamcharts', 'teammemberstable', 'partners', 'partnercrm', 'partnermanagement', 'partnerrow', 'partnerstable', 'partnerdetailmodal', 'partnerprofilemodal', 'agentgridcard', 'agentdetailsmodal', 'leaderboard', 'leaderdashboard', 'leadershipladder', 'top3podium', 'ranks', 'rankprogressbar', 'rankladdersection', 'achievementgrid', 'agentdashboard', 'agentDashboard', 'partnerdetailmodal'],
        'referral': ['referral', 'referralhero', 'referralqrcode', 'referraltrendchart', 'referralnetworkview', 'referralrewardslist', 'affiliatelinksection', 'networktree', 'inviteflowmodal'],
        'copilot': ['copilot', 'copilotpage', 'copilotheader', 'copilotcoaching', 'copilotmessageitem', 'copilotsuggestions', 'useCopilot', 'chatmessage', 'chatsidebar', 'contextsidebar', 'airecommendation', 'beeautomationsection'],
        'marketing': ['marketing', 'marketingtools', 'landingpage', 'landing', 'eastasiabrand', 'agencyos', 'agencyosdemo', 'cms', 'founderrevenuegoal', 'valuationcard', 'venture', 'venturefooter', 'venturemarketmap', 'venturenavigation', 'ventureportfolio', 'portfoliosection', 'exitIntent'],
        'health': ['healthCoach', 'healthCheck', 'healthcheck'],
        'admin': ['admin', 'adminsecuritysettings', 'auditlog', 'bulkactionsbar', 'policyEngine', 'debuggerpage', 'testpage', 'simulationpanel', 'fraudbadge']
    }

    # Files that were not grouped
    all_grouped_keys = [k for v in groups.values() for k in v]
    remaining_keys = [k for k in keys.keys() if k not in all_grouped_keys]
    if remaining_keys:
        groups['misc'] = remaining_keys

    for group_name, group_keys in groups.items():
        output_file = os.path.join(output_dir, f"{group_name}.ts")
        group_content = []
        for k in group_keys:
            if k in keys:
                group_content.append(keys[k])

        if group_content:
            with open(output_file, 'w', encoding='utf-8') as out_f:
                out_f.write(f"export const {group_name} = {{\n")
                out_f.write(',\n'.join(group_content))
                out_f.write("\n};\n")

if __name__ == "__main__":
    split_vi_ts('/Users/macbookprom1/archive-2026/Well/src/locales/vi.ts', '/Users/macbookprom1/archive-2026/Well/src/locales/vi')
