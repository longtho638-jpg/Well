/**
 * Agent Intent Classifier — Nixpacks auto-detection pattern applied to user intent.
 * Like Nixpacks detects language from package.json/pyproject.toml,
 * this classifier detects user intent from message keywords to route to the correct agent.
 *
 * Pattern: Plan→Build→Deploy mapped to Detect→Route→Execute
 */

/** Supported agent intents */
export type AgentIntent =
  | 'health-coaching'
  | 'sales-copilot'
  | 'commission-inquiry'
  | 'product-search'
  | 'team-management'
  | 'general';

interface IntentRule {
  intent: AgentIntent;
  keywords: string[];
  agentName: string;
}

/**
 * Keyword-based rules for intent classification.
 * Each rule maps keywords → intent → agent.
 */
const INTENT_RULES: IntentRule[] = [
  {
    intent: 'health-coaching',
    agentName: 'Gemini Coach',
    keywords: [
      'sức khỏe', 'health', 'coach', 'tư vấn', 'dinh dưỡng', 'nutrition',
      'tập luyện', 'exercise', 'vitamin', 'bổ sung', 'supplement',
      'lời khuyên', 'advice', 'cải thiện', 'improve', 'rank',
      'doanh số', 'sales target', 'mục tiêu',
    ],
  },
  {
    intent: 'sales-copilot',
    agentName: 'Sales Copilot',
    keywords: [
      'bán hàng', 'sales', 'khách hàng', 'customer', 'objection',
      'phản đối', 'kịch bản', 'script', 'pitch', 'giới thiệu',
      'chốt đơn', 'close', 'deal', 'prospect', 'tiếp cận',
      'conversation', 'hội thoại',
    ],
  },
  {
    intent: 'commission-inquiry',
    agentName: 'Gemini Coach',
    keywords: [
      'hoa hồng', 'commission', 'thu nhập', 'income', 'earnings',
      'chiết khấu', 'discount', 'thưởng', 'bonus', 'payout',
    ],
  },
  {
    intent: 'product-search',
    agentName: 'Sales Copilot',
    keywords: [
      'sản phẩm', 'product', 'tìm kiếm', 'search', 'giá', 'price',
      'mua', 'buy', 'đặt hàng', 'order', 'catalog', 'danh mục',
    ],
  },
  {
    intent: 'team-management',
    agentName: 'Gemini Coach',
    keywords: [
      'đội nhóm', 'team', 'downline', 'network', 'thành viên', 'member',
      'quản lý', 'manage', 'đào tạo', 'training', 'hiệu suất', 'performance',
    ],
  },
];

export interface ClassificationResult {
  intent: AgentIntent;
  agentName: string;
  confidence: number;
}

/**
 * Classify user message to detect intent and route to correct agent.
 * Returns the best matching intent with confidence score.
 */
export function classifyIntent(message: string): ClassificationResult {
  const lowerMessage = message.toLowerCase();

  let bestMatch: { rule: IntentRule; matchCount: number } | null = null;

  for (const rule of INTENT_RULES) {
    const matchCount = rule.keywords.filter(kw => lowerMessage.includes(kw.toLowerCase())).length;
    if (matchCount > 0 && (!bestMatch || matchCount > bestMatch.matchCount)) {
      bestMatch = { rule, matchCount };
    }
  }

  if (!bestMatch) {
    return { intent: 'general', agentName: 'Gemini Coach', confidence: 0.3 };
  }

  const confidence = Math.min(0.95, 0.5 + (bestMatch.matchCount * 0.15));
  return {
    intent: bestMatch.rule.intent,
    agentName: bestMatch.rule.agentName,
    confidence,
  };
}

/**
 * Get all available intents for display/documentation purposes.
 */
export function getAvailableIntents(): Array<{ intent: AgentIntent; agentName: string }> {
  const seen = new Set<AgentIntent>();
  return INTENT_RULES
    .filter(r => {
      if (seen.has(r.intent)) return false;
      seen.add(r.intent);
      return true;
    })
    .map(r => ({ intent: r.intent, agentName: r.agentName }));
}
