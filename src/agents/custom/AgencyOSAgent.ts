/**
 * AgencyOS Command Agent (Refactored)
 * Integrates 85+ AgencyOS slash commands into WellNexus Agent-OS.
 * 
 * Logic and definitions moved to commandDefinitions.ts for better maintainability.
 */

import { BaseAgent } from '../core/BaseAgent';
import { AgentDefinition } from '@/types/agentic';
import {
    AGENCYOS_COMMANDS,
    AgencyOSCategory,
    AgencyOSCommand,
    commandStore,
    generateCommandOutput
} from './commandDefinitions';

export type { AgencyOSCategory, AgencyOSCommand };
export { AGENCYOS_COMMANDS, commandStore, generateCommandOutput };

// Types for internal tracking
interface CommandExecutionResult {
    success: boolean;
    command: string;
    description?: string;
    category?: string;
    executedAt?: string;
    message?: string;
    output?: string;
    error?: string;
    suggestion?: AgencyOSCommand[];
}

interface CommandHistoryEntry {
    command: string;
    timestamp: string;
    result: CommandExecutionResult | null;
}

export class AgencyOSAgent extends BaseAgent {
    private commandHistory: CommandHistoryEntry[] = [];

    constructor() {
        const definition: AgentDefinition = {
            agent_name: 'AgencyOS',
            business_function: 'Operations & Logistics',
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
     * Main execution entry point
     */
    async execute(input: {
        action: 'executeCommand' | 'listCommands' | 'getCommandHelp' | 'searchCommands';
        command?: string;
        context?: Record<string, unknown>;
        category?: AgencyOSCategory;
    }): Promise<CommandExecutionResult | { success: boolean; total: number; categories: Record<string, unknown> }> {
        const { action, command, context, category } = input;

        const canProceed = await this.checkPolicies(action, input);
        if (!canProceed) {
            return {
                success: false,
                command: command || '',
                error: 'Action blocked by policy: High-value operations require human review.'
            };
        }

        try {
            switch (action) {
                case 'executeCommand': {
                    if (!command) throw new Error('Command identifier is required');
                    const output = await this.executeAgencyOSCommand(command, context);
                    this.log(action, input, output);

                    if (output.success) {
                        const current = this.definition.success_kpis.find(k => k.name === 'Commands Executed')?.current || 0;
                        this.updateKPI('Commands Executed', current + 1);
                    }
                    return output;
                }

                case 'listCommands': {
                    const output = this.listCommands(category);
                    this.log(action, input, output);
                    return { success: true, ...output };
                }

                case 'getCommandHelp': {
                    if (!command) throw new Error('Command query is required for help documentation');
                    const result = commandStore.find(command);
                    if (!result) throw new Error(`Command not found: ${command}`);

                    const output: CommandExecutionResult = {
                        success: true,
                        command,
                        description: result.description,
                        category: result.category,
                        message: `Help info for ${command}`
                    };
                    this.log(action, input, output);
                    return output;
                }

                case 'searchCommands': {
                    if (!command) throw new Error('Search string is required');
                    const results = commandStore.search(command);

                    const output: CommandExecutionResult = {
                        success: true,
                        command: 'search',
                        message: `Found ${results.length} matching commands`,
                        suggestion: results
                    };
                    this.log(action, input, output);
                    return output;
                }

                default: {
                    const _exhaustiveCheck: never = action;
                    throw new Error(`Execution error: Unknown action type ${_exhaustiveCheck}`);
                }
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown execution error';
            const errorOutput: CommandExecutionResult = {
                success: false,
                command: command || '',
                error: errorMsg
            };
            this.log(action, input, errorOutput);
            return errorOutput;
        }
    }

    /**
     * Execute a specific AgencyOS command (Simulation)
     */
    private async executeAgencyOSCommand(
        command: string,
        context?: Record<string, unknown>
    ): Promise<CommandExecutionResult> {
        const normalizedCommand = command.startsWith('/') ? command : `/${command}`;

        const commandInfo = commandStore.find(normalizedCommand);
        if (!commandInfo) {
            return {
                success: false,
                command: normalizedCommand,
                error: `Unknown command: ${normalizedCommand}`,
                suggestion: commandStore.search(normalizedCommand.replace('/', '')),
            };
        }

        const executionTimestamp = new Date().toISOString();
        const result: CommandExecutionResult = {
            success: true,
            command: normalizedCommand,
            description: commandInfo.description,
            category: commandInfo.category,
            executedAt: executionTimestamp,
            message: `✅ Command ${normalizedCommand} executed successfully.`,
            output: generateCommandOutput(normalizedCommand, context),
        };

        this.commandHistory.push({
            command: normalizedCommand,
            timestamp: executionTimestamp,
            result,
        });

        return result;
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
     * Get command execution history
     */
    getCommandHistory(): CommandHistoryEntry[] {
        return [...this.commandHistory];
    }
}
