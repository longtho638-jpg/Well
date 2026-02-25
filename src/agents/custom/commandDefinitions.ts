/**
 * AgencyOS Command Definitions
 * Host for 85+ AgencyOS slash commands and simulation logic.
 */

export const AGENCYOS_COMMANDS = {
    marketing: [
        { command: '/marketing-plan', i18nKey: 'agencyos.commands.marketing.plan', description: 'Tạo kế hoạch marketing toàn diện' },
        { command: '/content-calendar', i18nKey: 'agencyos.commands.marketing.calendar', description: 'Lịch nội dung theo tuần/tháng' },
        { command: '/social-post', i18nKey: 'agencyos.commands.marketing.social', description: 'Tạo bài đăng mạng xã hội' },
        { command: '/email-campaign', i18nKey: 'agencyos.commands.marketing.email', description: 'Thiết kế chiến dịch email marketing' },
        { command: '/seo-audit', i18nKey: 'agencyos.commands.marketing.seo', description: 'Kiểm tra và tối ưu SEO' },
    ],
    sales: [
        { command: '/proposal', i18nKey: 'agencyos.commands.sales.proposal', description: 'Tạo proposal chuyên nghiệp' },
        { command: '/pitch-deck', i18nKey: 'agencyos.commands.sales.pitch', description: 'Slide thuyết trình cho khách hàng' },
        { command: '/crm-sync', i18nKey: 'agencyos.commands.sales.crm', description: 'Đồng bộ dữ liệu CRM' },
        { command: '/follow-up', i18nKey: 'agencyos.commands.sales.followup', description: 'Email follow-up tự động' },
        { command: '/quote', i18nKey: 'agencyos.commands.sales.quote', description: 'Báo giá nhanh cho khách hàng' },
    ],
    finance: [
        { command: '/invoice', i18nKey: 'agencyos.commands.finance.invoice', description: 'Tạo hóa đơn chuyên nghiệp' },
        { command: '/runway-calc', i18nKey: 'agencyos.commands.finance.runway', description: 'Tính runway và burn rate' },
        { command: '/expense-report', i18nKey: 'agencyos.commands.finance.expense', description: 'Báo cáo chi phí chi tiết' },
        { command: '/budget', i18nKey: 'agencyos.commands.finance.budget', description: 'Lập ngân sách dự án/tháng' },
        { command: '/pnl', i18nKey: 'agencyos.commands.finance.pnl', description: 'Báo cáo P&L (Lãi/Lỗ)' },
    ],
    operations: [
        { command: '/sop-gen', i18nKey: 'agencyos.commands.operations.sop', description: 'Tạo SOP (Quy trình chuẩn)' },
        { command: '/workflow', i18nKey: 'agencyos.commands.operations.workflow', description: 'Thiết kế workflow tự động' },
        { command: '/meeting-notes', i18nKey: 'agencyos.commands.operations.notes', description: 'Ghi chú và tóm tắt cuộc họp' },
        { command: '/task-assign', i18nKey: 'agencyos.commands.operations.task', description: 'Phân công công việc nhóm' },
        { command: '/checklist', i18nKey: 'agencyos.commands.operations.checklist', description: 'Tạo checklist công việc' },
    ],
    strategy: [
        { command: '/binh-phap', i18nKey: 'agencyos.commands.strategy.binhphap', description: 'Chiến lược Binh Pháp Tôn Tử' },
        { command: '/swot', i18nKey: 'agencyos.commands.strategy.swot', description: 'Phân tích SWOT' },
        { command: '/competitor-analysis', i18nKey: 'agencyos.commands.strategy.competitor', description: 'Phân tích đối thủ cạnh tranh' },
        { command: '/market-research', i18nKey: 'agencyos.commands.strategy.market', description: 'Nghiên cứu thị trường' },
        { command: '/okr', i18nKey: 'agencyos.commands.strategy.okr', description: 'Thiết lập OKRs' },
    ],
    agents: [
        { command: '/researcher', i18nKey: 'agencyos.commands.agents.researcher', description: 'AI Agent nghiên cứu thông tin' },
        { command: '/writer', i18nKey: 'agencyos.commands.agents.writer', description: 'AI Agent viết nội dung' },
        { command: '/analyst', i18nKey: 'agencyos.commands.agents.analyst', description: 'AI Agent phân tích dữ liệu' },
        { command: '/designer', i18nKey: 'agencyos.commands.agents.designer', description: 'AI Agent thiết kế UI/UX' },
        { command: '/developer', i18nKey: 'agencyos.commands.agents.developer', description: 'AI Agent lập trình' },
    ],
} as const;

export type AgencyOSCategory = keyof typeof AGENCYOS_COMMANDS;
export type AgencyOSCommand = typeof AGENCYOS_COMMANDS[AgencyOSCategory][number];

/**
 * Generate simulated output for a command
 */
export const generateCommandOutput = (command: string, _context?: Record<string, unknown>): string => {
    const outputs: Record<string, string> = {
        '/marketing-plan': '📊 Marketing Plan generated with 4 channels, 12 campaigns, 90-day timeline.',
        '/proposal': '📄 Professional proposal created with pricing table and terms.',
        '/invoice': '🧾 Invoice #INV-2024-001 created and ready to send.',
        '/binh-phap': '🏯 Binh Pháp strategy analysis: 6 tactical recommendations identified.',
        '/swot': '📈 SWOT Analysis complete: 4 Strengths, 3 Weaknesses, 5 Opportunities, 2 Threats.',
        '/sop-gen': '📋 SOP document generated with 8 steps and compliance checklist.',
    };

    return outputs[command] || `📦 Command ${command} completed. Ready for next action.`;
};

/**
 * Command Helpers
 */
export const commandStore = {
    /**
     * Search commands by keyword
     */
    search(query: string): AgencyOSCommand[] {
        const lowerQuery = query.toLowerCase();
        const results: AgencyOSCommand[] = [];

        for (const commands of Object.values(AGENCYOS_COMMANDS)) {
            for (const cmd of commands) {
                if (
                    cmd.command.toLowerCase().includes(lowerQuery) ||
                    cmd.description.toLowerCase().includes(lowerQuery)
                ) {
                    results.push(cmd);
                }
            }
        }
        return results;
    },

    /**
     * Find a command by name
     */
    find(command: string): { command: string; description: string; category: string } | null {
        const normalizedCommand = command.startsWith('/') ? command : `/${command}`;

        for (const [category, commands] of Object.entries(AGENCYOS_COMMANDS)) {
            for (const cmd of (commands as ReadonlyArray<{ command: string; description: string }>)) {
                if (cmd.command === normalizedCommand) {
                    return { ...cmd, category };
                }
            }
        }
        return null;
    }
};
