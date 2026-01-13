/**
 * AgencyOS Command Definitions
 * Host for 85+ AgencyOS slash commands and simulation logic.
 */

export const AGENCYOS_COMMANDS = {
    marketing: [
        { command: '/marketing-plan', description: 'Tạo kế hoạch marketing toàn diện' },
        { command: '/content-calendar', description: 'Lịch nội dung theo tuần/tháng' },
        { command: '/social-post', description: 'Tạo bài đăng mạng xã hội' },
        { command: '/email-campaign', description: 'Thiết kế chiến dịch email marketing' },
        { command: '/seo-audit', description: 'Kiểm tra và tối ưu SEO' },
    ],
    sales: [
        { command: '/proposal', description: 'Tạo proposal chuyên nghiệp' },
        { command: '/pitch-deck', description: 'Slide thuyết trình cho khách hàng' },
        { command: '/crm-sync', description: 'Đồng bộ dữ liệu CRM' },
        { command: '/follow-up', description: 'Email follow-up tự động' },
        { command: '/quote', description: 'Báo giá nhanh cho khách hàng' },
    ],
    finance: [
        { command: '/invoice', description: 'Tạo hóa đơn chuyên nghiệp' },
        { command: '/runway-calc', description: 'Tính runway và burn rate' },
        { command: '/expense-report', description: 'Báo cáo chi phí chi tiết' },
        { command: '/budget', description: 'Lập ngân sách dự án/tháng' },
        { command: '/pnl', description: 'Báo cáo P&L (Lãi/Lỗ)' },
    ],
    operations: [
        { command: '/sop-gen', description: 'Tạo SOP (Quy trình chuẩn)' },
        { command: '/workflow', description: 'Thiết kế workflow tự động' },
        { command: '/meeting-notes', description: 'Ghi chú và tóm tắt cuộc họp' },
        { command: '/task-assign', description: 'Phân công công việc nhóm' },
        { command: '/checklist', description: 'Tạo checklist công việc' },
    ],
    strategy: [
        { command: '/binh-phap', description: 'Chiến lược Binh Pháp Tôn Tử' },
        { command: '/swot', description: 'Phân tích SWOT' },
        { command: '/competitor-analysis', description: 'Phân tích đối thủ cạnh tranh' },
        { command: '/market-research', description: 'Nghiên cứu thị trường' },
        { command: '/okr', description: 'Thiết lập OKRs' },
    ],
    agents: [
        { command: '/researcher', description: 'AI Agent nghiên cứu thông tin' },
        { command: '/writer', description: 'AI Agent viết nội dung' },
        { command: '/analyst', description: 'AI Agent phân tích dữ liệu' },
        { command: '/designer', description: 'AI Agent thiết kế UI/UX' },
        { command: '/developer', description: 'AI Agent lập trình' },
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
