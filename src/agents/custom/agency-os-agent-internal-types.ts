/**
 * AgencyOSAgent — internal types and command execution helper.
 * Extracted to keep AgencyOSAgent.ts under 200 LOC.
 */

import type { AgencyOSCommand } from './commandDefinitions';
import { commandStore, generateCommandOutput } from './commandDefinitions';

export interface CommandExecutionResult {
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

export interface CommandHistoryEntry {
    command: string;
    timestamp: string;
    result: CommandExecutionResult | null;
}

/**
 * Execute a specific AgencyOS command (simulation).
 * Pure function — receives commandHistory by reference and mutates it.
 */
export async function executeAgencyOSCommand(
    command: string,
    commandHistory: CommandHistoryEntry[],
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

    commandHistory.push({
        command: normalizedCommand,
        timestamp: executionTimestamp,
        result,
    });

    return result;
}
