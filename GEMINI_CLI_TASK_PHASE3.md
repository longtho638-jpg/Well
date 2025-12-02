# Task for Gemini CLI: Phase 3 - Custom Agent Refactoring

## Context
✅ **Phase 1 Complete**: Type system established  
✅ **Phase 2 Complete**: Agent Registry & BaseAgent architecture ready

You are now implementing **Phase 3**: Refactoring existing services into proper Agent-OS agents.

---

## Objectives

1. Refactor `src/services/geminiService.ts` → `src/agents/custom/GeminiCoachAgent.ts`
2. Refactor `src/services/copilotService.ts` → `src/agents/custom/SalesCopilotAgent.ts`
3. Register these agents in the AgentRegistry
4. Maintain backward compatibility (keep old service files as thin wrappers)

---

## Task 1: Create GeminiCoachAgent

### File: `src/agents/custom/GeminiCoachAgent.ts`

**Requirements:**
- Extend `BaseAgent` from `@/agents/core/BaseAgent`
- Wrap existing Gemini API functionality
- Add proper `AgentDefinition` with policies and KPIs
- Implement logging for all actions
- Support both `getCoachAdvice` and `checkCompliance` functions

**Implementation:**

```typescript
import { BaseAgent } from '../core/BaseAgent';
import { AgentDefinition } from '@/types/agentic';
import { User } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Business Coach Agent powered by Google Gemini.
 * Provides personalized coaching and tax compliance checking.
 */
export class GeminiCoachAgent extends BaseAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const definition: AgentDefinition = {
      agent_name: 'Gemini Coach',
      business_function: 'Customer Success & Support',
      primary_objectives: [
        'Provide personalized business coaching based on user performance',
        'Analyze sales data and suggest actionable improvements',
        'Detect potential tax compliance issues',
        'Guide users toward next rank progression',
      ],
      inputs: [
        { source: 'user_profile', dataType: 'CRM' },
        { source: 'transaction_history', dataType: 'API' },
        { source: 'user_context', dataType: 'user_input' },
      ],
      tools_and_systems: [
        'Google Gemini API (gemini-2.0-flash)',
        'User Store',
        'Transaction Database',
      ],
      core_actions: [
        'generateCoachingAdvice',
        'checkTaxCompliance',
        'analyzePerformance',
        'suggestNextSteps',
      ],
      outputs: [
        'coaching_message',
        'compliance_report',
        'performance_analysis',
      ],
      success_kpis: [
        { name: 'User Satisfaction', target: 85, current: 0, unit: '%' },
        { name: 'Advice Relevance', target: 90, current: 0, unit: '%' },
        { name: 'Compliance Detection Rate', target: 95, current: 0, unit: '%' },
      ],
      risk_and_failure_modes: [
        'AI hallucination (providing incorrect financial advice)',
        'API rate limits exceeded',
        'Outdated tax law knowledge',
        'Biased recommendations',
      ],
      human_in_the_loop_points: [
        'Critical tax compliance warnings must be reviewed by compliance officer',
        'High-value financial advice (>50M VND impact) requires approval',
      ],
      policy_and_constraints: [
        {
          rule: 'No specific investment advice or financial product recommendations',
          enforcement: 'hard',
          notes: 'We are not licensed financial advisors',
        },
        {
          rule: 'Never promise specific tax outcomes or guarantee compliance',
          enforcement: 'hard',
          notes: 'Tax law is complex and subject to interpretation',
        },
        {
          rule: 'Always cite Vietnam Circular 111/2013/TT-BTC when discussing tax',
          enforcement: 'soft',
          notes: 'Helps users understand legal basis',
        },
        {
          rule: 'Advice must be in Vietnamese for Vietnam market',
          enforcement: 'soft',
        },
      ],
    };

    super(definition);

    // Initialize Gemini API
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[GeminiCoachAgent] No API key found. Agent will return fallback responses.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Main execution method - routes to specific actions.
   */
  async execute(input: { action: string; user?: User; context?: string; transaction?: any }): Promise<any> {
    const { action, user, context, transaction } = input;

    // Policy check
    const canProceed = await this.checkPolicies(action, input);
    if (!canProceed) {
      return { error: 'Action blocked by policy', action };
    }

    try {
      let output;

      switch (action) {
        case 'getCoachAdvice':
          if (!user) throw new Error('User required for coaching advice');
          output = await this.getCoachAdvice(user, context);
          break;

        case 'checkCompliance':
          if (!transaction) throw new Error('Transaction required for compliance check');
          output = await this.checkCompliance(transaction);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Log successful execution
      this.log(action, input, output, false);

      return output;
    } catch (error) {
      const errorOutput = {
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: this.getFallbackResponse(action),
      };

      this.log(action, input, errorOutput, false);

      return errorOutput;
    }
  }

  /**
   * Generate personalized coaching advice for a user.
   */
  private async getCoachAdvice(user: User, context?: string): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Fallback if no API key
    if (!apiKey) {
      return this.getFallbackCoachingAdvice(user);
    }

    try {
      const prompt = this.buildCoachingPrompt(user, context);
      const result = await this.model.generateContent(prompt);
      const advice = result.response.text();

      return advice;
    } catch (error) {
      console.error('[GeminiCoachAgent] API Error:', error);
      return this.getFallbackCoachingAdvice(user);
    }
  }

  /**
   * Check tax compliance for a transaction.
   */
  private async checkCompliance(transaction: any): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return 'Compliance check unavailable without API key.';
    }

    try {
      const prompt = `You are a tax compliance expert for Vietnam.
Transaction: ${transaction.amount} VND, Type: ${transaction.type}
Reference: Vietnam Circular 111/2013/TT-BTC (10% PIT on income > 2M VND/month)

Check if this transaction complies with Vietnam tax law. Be concise (2-3 sentences).`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('[GeminiCoachAgent] Compliance Check Error:', error);
      return 'Unable to verify compliance at this time.';
    }
  }

  /**
   * Build the coaching prompt for Gemini API.
   */
  private buildCoachingPrompt(user: User, context?: string): string {
    return `Bạn là coach kinh doanh chuyên nghiệp cho ${user.name} (${user.rank}) tại WellNexus.

Dữ liệu hiện tại:
- Doanh số cá nhân: ${user.totalSales.toLocaleString('vi-VN')} VND
- Team volume: ${user.teamVolume.toLocaleString('vi-VN')} VND
- Rank hiện tại: ${user.rank}

${context ? `Bối cảnh: ${context}` : 'Bối cảnh: Tư vấn chung'}

Hãy đưa ra 2-3 lời khuyên cụ thể, khả thi để cải thiện hiệu suất kinh doanh.
Tập trung vào:
1. Cách tăng doanh số
2. Phát triển đội nhóm
3. Tiến đến rank tiếp theo

Trả lời bằng tiếng Việt, giọng điệu thân thiện và động viên.`;
  }

  /**
   * Fallback coaching advice when API is unavailable.
   */
  private getFallbackCoachingAdvice(user: User): string {
    const advice = [
      `Chào ${user.name}! Bạn đang làm rất tốt với doanh số ${user.totalSales.toLocaleString('vi-VN')} VND.`,
      '',
      '💡 **3 gợi ý để cải thiện:**',
      '1. **Tăng tần suất tiếp cận khách hàng**: Hãy thử liên hệ ít nhất 5 khách hàng tiềm năng mỗi ngày.',
      '2. **Chia sẻ câu chuyện thành công**: Khách hàng tin tưởng vào những trải nghiệm thực tế. Hãy chia sẻ case study của bạn.',
      '3. **Đào tạo đội nhóm**: Team volume hiện tại của bạn là ${user.teamVolume.toLocaleString('vi-VN')} VND. Hỗ trợ downline sẽ giúp bạn tăng trưởng nhanh hơn.',
      '',
      'Tiếp tục phát huy! 🚀',
    ].join('\n');

    return advice;
  }

  /**
   * Generic fallback response for any action.
   */
  private getFallbackResponse(action: string): string {
    return `[Gemini Coach Agent] Unable to complete action: ${action}. Please try again later.`;
  }
}
```

---

## Task 2: Create SalesCopilotAgent

### File: `src/agents/custom/SalesCopilotAgent.ts`

**Requirements:**
- Extend `BaseAgent`
- Wrap objection detection and response generation
- Implement proper agent definition

**Implementation:**

```typescript
import { BaseAgent } from '../core/BaseAgent';
import { AgentDefinition } from '@/types/agentic';
import { ObjectionType } from '@/types';

// Import templates from original copilotService
const OBJECTION_TEMPLATES = [
  {
    type: 'price' as ObjectionType,
    keywords: ['đắt', 'giá cao', 'expensive', 'costly', 'too much', 'quá đắt'],
    responses: [
      'Tôi hiểu lo ngại của bạn về giá cả. Tuy nhiên, hãy xem đây là khoản đầu tư cho sức khỏe dài hạn...',
      'Giá trị sản phẩm vượt xa mức giá. Với chất lượng này, bạn đang tiết kiệm chi phí y tế dài hạn.',
    ],
  },
  {
    type: 'skepticism' as ObjectionType,
    keywords: ['không tin', 'nghi ngờ', 'doubt', 'skeptical', 'scam', 'lừa đảo'],
    responses: [
      'Tôi hoàn toàn hiểu sự thận trọng của bạn. Có thể bạn muốn xem chứng nhận chất lượng hoặc phản hồi từ khách hàng khác?',
      'Đây là câu hỏi rất hay! Chúng tôi có đầy đủ giấy tờ chứng nhận và hàng ngàn khách hàng hài lòng.',
    ],
  },
  // Add more templates as needed
];

/**
 * Sales Copilot Agent - AI assistant for objection handling.
 */
export class SalesCopilotAgent extends BaseAgent {
  constructor() {
    const definition: AgentDefinition = {
      agent_name: 'Sales Copilot',
      business_function: 'Sales & Revenue',
      primary_objectives: [
        'Detect customer objections in real-time conversations',
        'Suggest appropriate responses to overcome objections',
        'Track objection patterns to improve sales training',
      ],
      inputs: [
        { source: 'customer_message', dataType: 'user_input' },
        { source: 'conversation_context', dataType: 'CRM' },
      ],
      tools_and_systems: ['Objection Template Database', 'CRM'],
      core_actions: [
        'detectObjection',
        'suggestResponse',
        'trackObjectionPatterns',
      ],
      outputs: [
        'objection_type',
        'suggested_response',
        'alternative_responses',
      ],
      success_kpis: [
        { name: 'Objection Detection Accuracy', target: 85, current: 0, unit: '%' },
        { name: 'Response Acceptance Rate', target: 70, current: 0, unit: '%' },
        { name: 'Conversion Rate Improvement', target: 15, current: 0, unit: '%' },
      ],
      risk_and_failure_modes: [
        'Misclassifying objection type',
        'Suggesting inappropriate responses',
        'Missing cultural nuances in Vietnamese',
      ],
      human_in_the_loop_points: [
        'Sales agent must review and adapt suggested responses',
        'All responses must be approved before sending to customer',
      ],
      policy_and_constraints: [
        {
          rule: 'Never make false claims about product efficacy',
          enforcement: 'hard',
        },
        {
          rule: 'Responses must respect customer concerns, not dismiss them',
          enforcement: 'hard',
        },
        {
          rule: 'No aggressive or pushy sales tactics',
          enforcement: 'hard',
        },
      ],
    };

    super(definition);
  }

  /**
   * Execute copilot actions.
   */
  async execute(input: { action: string; message?: string }): Promise<any> {
    const { action, message } = input;

    const canProceed = await this.checkPolicies(action, input);
    if (!canProceed) {
      return { error: 'Action blocked by policy' };
    }

    try {
      let output;

      switch (action) {
        case 'detectObjection':
          if (!message) throw new Error('Message required for objection detection');
          output = this.detectObjection(message);
          break;

        case 'suggestResponse':
          if (!message) throw new Error('Message required for response suggestion');
          const objectionType = this.detectObjection(message);
          output = this.getObjectionResponse(objectionType);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      this.log(action, input, output);
      return output;
    } catch (error) {
      const errorOutput = { error: error instanceof Error ? error.message : 'Unknown error' };
      this.log(action, input, errorOutput);
      return errorOutput;
    }
  }

  /**
   * Detect objection type from customer message.
   */
  private detectObjection(message: string): ObjectionType {
    const lowerMessage = message.toLowerCase();

    for (const template of OBJECTION_TEMPLATES) {
      if (template.keywords.some((keyword) => lowerMessage.includes(keyword))) {
        return template.type;
      }
    }

    return 'general';
  }

  /**
   * Get suggested response for an objection type.
   */
  private getObjectionResponse(objectionType: ObjectionType): string {
    const template = OBJECTION_TEMPLATES.find((t) => t.type === objectionType);

    if (!template || template.responses.length === 0) {
      return 'Tôi hiểu quan ngại của bạn. Hãy để tôi giải thích thêm về sản phẩm này...';
    }

    // Return random response from templates
    const randomIndex = Math.floor(Math.random() * template.responses.length);
    return template.responses[randomIndex];
  }
}
```

---

## Task 3: Register Custom Agents in Registry

### Modify: `src/agents/registry.ts`

Add imports and registration:

```typescript
// Add these imports at the top
import { GeminiCoachAgent } from './custom/GeminiCoachAgent';
import { SalesCopilotAgent } from './custom/SalesCopilotAgent';

// Modify registerDefaultAgents method:
private registerDefaultAgents(): void {
  // Register custom agents first
  this.register(new GeminiCoachAgent());
  this.register(new SalesCopilotAgent());
  
  // Then register ClaudeKit agents
  this.registerClaudeKitAgents();
}
```

---

## Task 4: Update Index Exports

### Modify: `src/agents/index.ts`

```typescript
// Core exports
export { BaseAgent } from './core/BaseAgent';
export { agentRegistry, AgentRegistry } from './registry';
export { ClaudeKitAdapter } from './claudekit/ClaudeKitAdapter';

// Custom agents
export { GeminiCoachAgent } from './custom/GeminiCoachAgent';
export { SalesCopilotAgent } from './custom/SalesCopilotAgent';
```

---

## Task 5: Create Backward Compatibility Wrappers (OPTIONAL - for safety)

### Modify: `src/services/geminiService.ts`

**Option A: Full replacement (risky)**
```typescript
// Replace entire file with thin wrapper
import { agentRegistry } from '@/agents';
import { User } from '@/types';

export async function getCoachAdvice(user: User, context?: string): Promise<string> {
  const agent = agentRegistry.get('Gemini Coach');
  if (!agent) throw new Error('Gemini Coach agent not found');
  
  const result = await agent.execute({ action: 'getCoachAdvice', user, context });
  return typeof result === 'string' ? result : result.error || 'Error';
}

export async function checkCompliance(transaction: any): Promise<string> {
  const agent = agentRegistry.get('Gemini Coach');
  if (!agent) throw new Error('Gemini Coach agent not found');
  
  const result = await agent.execute({ action: 'checkCompliance', transaction });
  return typeof result === 'string' ? result : result.error || 'Error';
}
```

**Option B: Keep original, add wrapper (safer)**
- Keep existing implementation
- Add wrapper functions that call agent
- Allows gradual migration

For this task, use **Option A** if you're confident, or **Option B** if you want to be safe.

---

## Verification Steps

1. **Build Check**:
   ```bash
   npm run build
   ```
   Should compile successfully (ignore pre-existing test errors).

2. **Registry Test**:
   ```typescript
   import { agentRegistry } from '@/agents';
   
   const coach = agentRegistry.get('Gemini Coach');
   console.log(coach?.getDefinition().primary_objectives);
   
   const copilot = agentRegistry.get('Sales Copilot');
   console.log(copilot?.getDefinition().business_function);
   
   console.log('Total agents:', agentRegistry.count()); // Should be 22+ (20 ClaudeKit + 2 custom)
   ```

3. **Functional Test**:
   ```typescript
   // Test Gemini Coach
   const testUser = { name: 'Test', rank: 'Member', totalSales: 5000000, teamVolume: 10000000 };
   const advice = await coach.execute({ action: 'getCoachAdvice', user: testUser });
   console.log(advice);
   ```

---

## Success Criteria

- ✅ `GeminiCoachAgent.ts` created and extends BaseAgent correctly
- ✅ `SalesCopilotAgent.ts` created and extends BaseAgent correctly
- ✅ Both agents registered in AgentRegistry
- ✅ Registry now contains 22+ agents (2 custom + 20 ClaudeKit)
- ✅ Agent exports available from `@/agents`
- ✅ Zero TypeScript errors in new files
- ✅ `npm run build` succeeds
- ✅ Optional: Backward compatibility maintained

---

## Deliverables

- `src/agents/custom/GeminiCoachAgent.ts`
- `src/agents/custom/SalesCopilotAgent.ts`
- Modified `src/agents/registry.ts`
- Modified `src/agents/index.ts`
- (Optional) Modified `src/services/geminiService.ts` and `copilotService.ts`

---

## Notes

- The original services used direct Gemini API calls - we're wrapping them in Agent architecture
- Fallback logic is important since API key might not be set
- Policy constraints are more for documentation than enforcement at this stage
- Human-in-the-loop points will be implemented in UI layer (Phase 6)

Proceed with Phase 3 implementation.
