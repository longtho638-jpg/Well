/**
 * Agent Survey Engine — Formbricks Survey Pattern
 *
 * Maps formbricks/formbricks survey engine to agent feedback collection.
 * Declarative surveys with targeting, triggers, and response aggregation.
 *
 * Formbricks concepts mapped:
 * - Survey: declarative question set with branching logic
 * - Question: typed input (rating, text, choice, NPS, CES)
 * - Trigger: when to show survey (event-based, time-based)
 * - Targeting: who sees the survey (segment filtering)
 * - Response: collected answer with metadata
 *
 * Pattern source: formbricks/formbricks survey-engine
 */

// ─── Types ──────────────────────────────────────────────────

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

// ─── Engine ─────────────────────────────────────────────────

class AgentSurveyEngine {
  private surveys = new Map<string, SurveyDefinition>();
  private responses = new Map<string, SurveyResponse[]>();
  private idCounter = 0;

  /** Register a survey */
  register(survey: SurveyDefinition): void {
    this.surveys.set(survey.id, survey);
    if (!this.responses.has(survey.id)) {
      this.responses.set(survey.id, []);
    }
  }

  /** Check if survey should trigger for given event + user attributes */
  shouldTrigger(surveyId: string, event: string, userAttrs?: Record<string, unknown>): boolean {
    const survey = this.surveys.get(surveyId);
    if (!survey?.active) return false;

    // Check response limit
    const resps = this.responses.get(surveyId) ?? [];
    if (survey.responseLimit && resps.length >= survey.responseLimit) return false;

    // Check trigger match
    const triggerMatch = survey.triggers.some((t) => t.type === 'event' && t.eventName === event);
    if (!triggerMatch) return false;

    // Check targeting
    if (survey.targeting.length === 0 || !userAttrs) return true;
    return survey.targeting.every((f) => {
      const val = userAttrs[f.attribute];
      if (f.operator === 'equals') return val === f.value;
      if (f.operator === 'contains') return String(val).includes(String(f.value));
      if (f.operator === 'gt') return Number(val) > Number(f.value);
      if (f.operator === 'lt') return Number(val) < Number(f.value);
      return false;
    });
  }

  /** Submit a response */
  submitResponse(surveyId: string, answers: Record<string, unknown>, respondentId?: string, metadata?: Record<string, string>): SurveyResponse | null {
    const survey = this.surveys.get(surveyId);
    if (!survey) return null;

    const response: SurveyResponse = {
      id: `resp_${++this.idCounter}`,
      surveyId,
      answers,
      respondentId,
      metadata: metadata ?? {},
      submittedAt: new Date().toISOString(),
    };

    const resps = this.responses.get(surveyId) ?? [];
    resps.push(response);
    this.responses.set(surveyId, resps);
    return response;
  }

  /** Get aggregated results for a survey */
  getResults(surveyId: string): SurveyResults | null {
    const survey = this.surveys.get(surveyId);
    const resps = this.responses.get(surveyId);
    if (!survey || !resps) return null;

    const questionStats = survey.questions.map((q) => {
      const vals = resps.map((r) => r.answers[q.id]).filter((v) => v !== undefined);
      const stat: SurveyResults['questionStats'][0] = { questionId: q.id, type: q.type };

      if (q.type === 'rating' || q.type === 'nps' || q.type === 'ces') {
        const nums = vals.map(Number).filter((n) => !isNaN(n));
        stat.avgRating = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
        stat.distribution = {};
        for (const n of nums) stat.distribution[String(n)] = (stat.distribution[String(n)] ?? 0) + 1;
      } else if (q.type === 'text') {
        stat.textResponses = vals.map(String);
      } else {
        stat.distribution = {};
        for (const v of vals) {
          const key = String(v);
          stat.distribution[key] = (stat.distribution[key] ?? 0) + 1;
        }
      }
      return stat;
    });

    // NPS calculation
    let npsScore: number | undefined;
    const npsQ = survey.questions.find((q) => q.type === 'nps');
    if (npsQ) {
      const npsVals = resps.map((r) => Number(r.answers[npsQ.id])).filter((n) => !isNaN(n));
      if (npsVals.length > 0) {
        const promoters = npsVals.filter((v) => v >= 9).length;
        const detractors = npsVals.filter((v) => v <= 6).length;
        npsScore = Math.round(((promoters - detractors) / npsVals.length) * 100);
      }
    }

    return { surveyId, totalResponses: resps.length, questionStats, npsScore };
  }

  /** List all surveys */
  listSurveys(): SurveyDefinition[] {
    return Array.from(this.surveys.values());
  }

  /** Clear all */
  clear(): void {
    this.surveys.clear();
    this.responses.clear();
    this.idCounter = 0;
  }
}

// ─── Singleton ──────────────────────────────────────────────

export const agentSurveyEngine = new AgentSurveyEngine();
