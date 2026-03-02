/**
 * Sales Copilot, objection handling, and conversation types
 * Extracted from src/types.ts for file size management
 */

export interface CopilotConversation {
  id: string;
  userId: string;
  messages: CopilotMessage[];
  productContext?: string;
  createdAt: string;
  status: 'active' | 'completed';
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  objectionType?: ObjectionType;
  suggestion?: string;
}

export type ObjectionType =
  | 'price'
  | 'skepticism'
  | 'competition'
  | 'timing'
  | 'need'
  | 'general';

export interface ObjectionTemplate {
  type: ObjectionType;
  keywords: string[];
  responses: string[];
}
