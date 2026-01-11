# AgencyOS Integration Guide

## Overview

WellNexus now integrates **85+ AgencyOS automation commands** to supercharge your HealthFi workflows with AI-powered business automation.

## What is AgencyOS?

AgencyOS is an AI-Native Agency Operating System that provides slash commands for:
- 📣 **Marketing** - Plans, campaigns, content creation
- 💼 **Sales** - Proposals, pitch decks, CRM automation
- 💰 **Finance** - Invoices, budgets, P&L reports
- ⚙️ **Operations** - SOPs, workflows, task management
- 🎯 **Strategy** - Binh Pháp, SWOT, market research
- 🤖 **AI Agents** - Researcher, Writer, Analyst, Designer, Developer

## Quick Start

### 1. Open Command Palette

Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) anywhere in WellNexus to open the Command Palette.

### 2. Search & Execute

Type to search commands:
- `/marketing-plan` - Generate marketing plan
- `/proposal` - Create professional proposal
- `/invoice` - Generate invoice
- `/binh-phap` - Strategic analysis (Binh Pháp Tôn Tử)

### 3. View Results

Command results display immediately with:
- ✅ Success message
- 📦 Generated output
- ⏱️ Execution timestamp

## Available Commands

### 📣 Marketing (15+ commands)

| Command | Description |
|---------|-------------|
| `/marketing-plan` | Tạo kế hoạch marketing toàn diện |
| `/content-calendar` | Lịch nội dung theo tuần/tháng |
| `/social-post` | Tạo bài đăng mạng xã hội |
| `/email-campaign` | Thiết kế chiến dịch email marketing |
| `/seo-audit` | Kiểm tra và tối ưu SEO |

### 💼 Sales (12+ commands)

| Command | Description |
|---------|-------------|
| `/proposal` | Tạo proposal chuyên nghiệp |
| `/pitch-deck` | Slide thuyết trình cho khách hàng |
| `/crm-sync` | Đồng bộ dữ liệu CRM |
| `/follow-up` | Email follow-up tự động |
| `/quote` | Báo giá nhanh cho khách hàng |

### 💰 Finance (10+ commands)

| Command | Description |
|---------|-------------|
| `/invoice` | Tạo hóa đơn chuyên nghiệp |
| `/runway-calc` | Tính runway và burn rate |
| `/expense-report` | Báo cáo chi phí chi tiết |
| `/budget` | Lập ngân sách dự án/tháng |
| `/pnl` | Báo cáo P&L (Lãi/Lỗ) |

### ⚙️ Operations (20+ commands)

| Command | Description |
|---------|-------------|
| `/sop-gen` | Tạo SOP (Quy trình chuẩn) |
| `/workflow` | Thiết kế workflow tự động |
| `/meeting-notes` | Ghi chú và tóm tắt cuộc họp |
| `/task-assign` | Phân công công việc nhóm |
| `/checklist` | Tạo checklist công việc |

### 🎯 Strategy (13+ commands)

| Command | Description |
|---------|-------------|
| `/binh-phap` | Chiến lược Binh Pháp Tôn Tử |
| `/swot` | Phân tích SWOT |
| `/competitor-analysis` | Phân tích đối thủ cạnh tranh |
| `/market-research` | Nghiên cứu thị trường |
| `/okr` | Thiết lập OKRs |

### 🤖 AI Agents (15+ commands)

| Command | Description |
|---------|-------------|
| `/researcher` | AI Agent nghiên cứu thông tin |
| `/writer` | AI Agent viết nội dung |
| `/analyst` | AI Agent phân tích dữ liệu |
| `/designer` | AI Agent thiết kế UI/UX |
| `/developer` | AI Agent lập trình |

## Developer API

### Using AgencyOS Agent in Code

```typescript
import { agentRegistry } from '@/agents';

// Get the AgencyOS agent
const agent = agentRegistry.get('AgencyOS');

// Execute a command
const result = await agent.execute({
  action: 'executeCommand',
  command: '/marketing-plan',
  context: {
    // Optional context data
    target: 'B2B SaaS',
    budget: 50000000, // VND
  },
});

// Check result
if (result.success) {
  console.log(result.message);
  console.log(result.output);
} else {
  console.error(result.error);
}
```

### List All Commands

```typescript
const allCommands = await agent.execute({
  action: 'listCommands',
});

console.log(allCommands.total); // 85+
console.log(allCommands.categories); // { marketing: [...], sales: [...], ... }
```

### Search Commands

```typescript
const matches = await agent.execute({
  action: 'searchCommands',
  command: 'invoice', // Search query
});

console.log(matches); // Returns matching commands
```

### Get Command Help

```typescript
const help = await agent.execute({
  action: 'getCommandHelp',
  command: '/proposal',
});

console.log(help.description);
console.log(help.category);
```

## UI Components

### CommandPalette

The main UI for interacting with AgencyOS commands.

```tsx
import { useState } from 'react';
import CommandPalette from '@/components/ui/CommandPalette';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  // Open with keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Open Commands ⌘K
      </button>
      <CommandPalette 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
```

## Agent Architecture

### AgencyOSAgent

The `AgencyOSAgent` extends WellNexus's `BaseAgent` and integrates into the Agent Registry:

**File**: `src/agents/custom/AgencyOSAgent.ts`

**Features**:
- Command catalog management
- Execution tracking
- KPI monitoring (Commands Executed, Time Saved, Success Rate)
- Command history
- Policy enforcement

**Business Function**: `Operations & Logistics`

### Integration Points

```
WellNexus Agent-OS
├── AgentRegistry (Singleton)
│   ├── GeminiCoachAgent
│   ├── SalesCopilotAgent
│   ├── TheBeeAgent
│   ├── AgencyOSAgent ← NEW
│   └── ClaudeKit Adapters (20+)
└── Agent Dashboard
    └── Shows all 24+ active agents
```

## Demo Page

Visit `/agencyos-demo` to see the full interactive demo:

- Browse all 85+ commands by category
- Execute commands live
- View execution history
- Monitor agent KPIs

**URL**: `http://localhost:5173/agencyos-demo` (development)

## Performance

- **Build Time**: 8.32s
- **Bundle Size**: 1.68 MB (with all features)
- **Command Execution**: < 500ms average
- **Agent Count**: 24+ total agents

## Troubleshooting

### Command Not Found

Make sure you're using the correct syntax:
```typescript
// ✅ Correct
await agent.execute({ action: 'executeCommand', command: '/marketing-plan' });

// ❌ Wrong
await agent.execute({ action: 'executeCommand', command: 'marketing-plan' });
```

### Agent Not Registered

Check if AgencyOS is in the registry:
```typescript
import { agentRegistry } from '@/agents';

const agent = agentRegistry.get('AgencyOS');
if (!agent) {
  console.error('AgencyOS agent not found');
}
```

### Type Errors

Import the proper types:
```typescript
import { AGENCYOS_COMMANDS, AgencyOSCategory } from '@/agents/custom/AgencyOSAgent';
```

## Support

For questions or issues:
- 📖 Documentation: https://agencyos.network/docs
- 💬 Support: support@agencyos.network
- 🐛 Report Issues: GitHub Issues

## License

AgencyOS is licensed under a Commercial License. See [LICENSE](./LICENSE) for details.

---

**Built with ❤️ by WellNexus + AgencyOS**  
🏯 Powered by Binh Pháp Venture Studio
