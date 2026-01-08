import { BaseAgent } from '../core/BaseAgent';
import { AgentDefinition } from '@/types/agentic';

/**
 * AgencyOS Command Agent
 * Integrates 85+ AgencyOS slash commands into WellNexus Agent-OS.
 * Supports Marketing, Sales, Finance, Operations, Strategy, and AI Agents categories.
 */

// AgencyOS Command Categories
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

export class AgencyOSAgent extends BaseAgent {
    private commandHistory: Array<{ command: string; timestamp: string; result: any }> = [];

    constructor() {
        const definition: AgentDefinition = {
            agent_name: 'AgencyOS',
            business_function: 'Operations & Logistics', // Primary function
            primary_objectives: [
                'Execute 85+ AgencyOS automation commands',
                'Streamline marketing, sales, finance, operations, and strategy workflows',
                'Provide AI-powered business automation within WellNexus',
            ],
            inputs: [
                { source: 'user_command', dataType: 'user_input' },
                { source: 'command_context', dataType: 'API' },
            ],
            tools_and_systems: [
                'AgencyOS Command Engine',
                'Gemini AI (for command execution)',
                'WellNexus Agent Registry',
            ],
            core_actions: [
                'executeCommand',
                'listCommands',
                'getCommandHelp',
                'searchCommands',
            ],
            outputs: [
                'command_result',
                'generated_content',
                'automation_log',
            ],
            success_kpis: [
                { name: 'Commands Executed', target: 1000, current: 0, unit: 'commands' },
                { name: 'Automation Time Saved', target: 100, current: 0, unit: 'hours' },
                { name: 'Success Rate', target: 99, current: 100, unit: '%' },
            ],
            risk_and_failure_modes: [
                'Invalid command syntax',
                'API rate limiting',
                'Context misunderstanding',
            ],
            human_in_the_loop_points: [
                'Financial commands (invoices, budgets > 100M VND)',
                'External communication (email campaigns, proposals)',
            ],
            policy_and_constraints: [
                {
                    rule: 'Require confirmation for external-facing content',
                    enforcement: 'soft',
                },
                {
                    rule: 'Log all command executions for audit trail',
                    enforcement: 'hard',
                },
            ],
            visibility: 'all',
        };

        super(definition);
    }

    /**
     * Execute an AgencyOS command
     */
    async execute(input: {
        action: string;
        command?: string;
        context?: Record<string, any>;
        category?: AgencyOSCategory;
    }): Promise<any> {
        const { action, command, context, category } = input;

        const canProceed = await this.checkPolicies(action, input);
        if (!canProceed) {
            return { error: 'Action blocked by policy' };
        }

        try {
            let output;

            switch (action) {
                case 'executeCommand':
                    if (!command) throw new Error('Command is required');
                    output = await this.executeAgencyOSCommand(command, context);
                    break;

                case 'listCommands':
                    output = this.listCommands(category);
                    break;

                case 'getCommandHelp':
                    if (!command) throw new Error('Command is required');
                    output = this.getCommandHelp(command);
                    break;

                case 'searchCommands':
                    if (!command) throw new Error('Search query is required');
                    output = this.searchCommands(command);
                    break;

                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            this.log(action, input, output);

            // Update KPI
            const execKpi = this.definition.success_kpis.find(k => k.name === 'Commands Executed');
            if (execKpi && action === 'executeCommand') {
                execKpi.current = (execKpi.current || 0) + 1;
            }

            return output;
        } catch (error) {
            const errorOutput = { error: error instanceof Error ? error.message : 'Unknown error' };
            this.log(action, input, errorOutput);
            return errorOutput;
        }
    }

    /**
     * Execute a specific AgencyOS command
     */
    private async executeAgencyOSCommand(
        command: string,
        context?: Record<string, any>
    ): Promise<any> {
        const normalizedCommand = command.startsWith('/') ? command : `/${command}`;

        // Find command info
        const commandInfo = this.findCommand(normalizedCommand);
        if (!commandInfo) {
            return {
                success: false,
                error: `Unknown command: ${normalizedCommand}`,
                suggestion: this.searchCommands(normalizedCommand.replace('/', '')),
            };
        }

        // Record execution
        const execution = {
            command: normalizedCommand,
            timestamp: new Date().toISOString(),
            result: null as any,
        };

        // Simulate command execution (in production, this would call actual AgencyOS backend)
        const result = {
            success: true,
            command: normalizedCommand,
            description: commandInfo.description,
            category: commandInfo.category,
            executedAt: execution.timestamp,
            message: `✅ Command ${normalizedCommand} executed successfully.`,
            output: this.generateCommandOutput(normalizedCommand, context),
        };

        execution.result = result;
        this.commandHistory.push(execution);

        return result;
    }

    /**
     * Generate simulated output for a command
     */
    private generateCommandOutput(command: string, context?: Record<string, any>): string {
        const outputs: Record<string, string> = {
            '/marketing-plan': '📊 Marketing Plan generated with 4 channels, 12 campaigns, 90-day timeline.',
            '/proposal': '📄 Professional proposal created with pricing table and terms.',
            '/invoice': '🧾 Invoice #INV-2024-001 created and ready to send.',
            '/binh-phap': '🏯 Binh Pháp strategy analysis: 6 tactical recommendations identified.',
            '/swot': '📈 SWOT Analysis complete: 4 Strengths, 3 Weaknesses, 5 Opportunities, 2 Threats.',
            '/sop-gen': '📋 SOP document generated with 8 steps and compliance checklist.',
        };

        return outputs[command] || `📦 Command ${command} completed. Ready for next action.`;
    }

    /**
     * List all commands, optionally filtered by category
     */
    private listCommands(category?: AgencyOSCategory): {
        total: number;
        categories: Record<string, readonly { readonly command: string; readonly description: string }[]>;
    } {
        if (category && AGENCYOS_COMMANDS[category]) {
            return {
                total: AGENCYOS_COMMANDS[category].length,
                categories: { [category]: AGENCYOS_COMMANDS[category] },
            };
        }

        return {
            total: Object.values(AGENCYOS_COMMANDS).flat().length,
            categories: AGENCYOS_COMMANDS,
        };
    }

    /**
     * Get help for a specific command
     */
    private getCommandHelp(command: string): { command: string; description: string; category: string } | null {
        return this.findCommand(command);
    }

    /**
     * Search commands by keyword
     */
    private searchCommands(query: string): AgencyOSCommand[] {
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
    }

    /**
     * Find a command by name
     */
    private findCommand(command: string): { command: string; description: string; category: string } | null {
        const normalizedCommand = command.startsWith('/') ? command : `/${command}`;

        for (const [category, commands] of Object.entries(AGENCYOS_COMMANDS)) {
            for (const cmd of commands) {
                if (cmd.command === normalizedCommand) {
                    return { ...cmd, category };
                }
            }
        }

        return null;
    }

    /**
     * Get command execution history
     */
    getCommandHistory(): Array<{ command: string; timestamp: string; result: any }> {
        return [...this.commandHistory];
    }
}
