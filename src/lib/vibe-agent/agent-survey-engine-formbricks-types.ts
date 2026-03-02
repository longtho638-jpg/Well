/**
 * Agent Survey Engine — Types (Formbricks Survey Pattern)
 *
 * Extracted from agent-survey-engine-formbricks-pattern.ts.
 * Contains: QuestionType, SurveyQuestion, SurveyTrigger, TargetingFilter,
 * SurveyDefinition, SurveyResponse, SurveyResults.
 */

export type QuestionType = 'rating' | 'nps' | 'ces' | 'text' | 'single-choice' | 'multi-choice' | 'boolean';

/** Survey question descriptor */
export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
  /** Conditional: show only if previous answer matches */
  showIf?: { questionId: string; value: unknown };
  /** Scale config for rating/nps/ces */
  scale?: { min: number; max: number; labels?: { start: string; end: string } };
}

/** Survey trigger condition */
export interface SurveyTrigger {
  type: 'event' | 'delay' | 'exit-intent' | 'scroll' | 'manual';
  /** Event name for event-based triggers */
  eventName?: string;
  /** Delay in ms for time-based */
  delayMs?: number;
}

/** Targeting segment filter */
export interface TargetingFilter {
  attribute: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt';
  value: unknown;
}

/** Survey definition */
export interface SurveyDefinition {
  id: string;
  name: string;
  questions: SurveyQuestion[];
  triggers: SurveyTrigger[];
  targeting: TargetingFilter[];
  /** Max responses before auto-close */
  responseLimit?: number;
  active: boolean;
}

/** Collected response */
export interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: Record<string, unknown>;
  respondentId?: string;
  metadata: Record<string, string>;
  submittedAt: string;
}

/** Aggregated survey results */
export interface SurveyResults {
  surveyId: string;
  totalResponses: number;
  questionStats: Array<{
    questionId: string;
    type: QuestionType;
    avgRating?: number;
    distribution?: Record<string, number>;
    textResponses?: string[];
  }>;
  npsScore?: number;
}
