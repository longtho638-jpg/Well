# Phase 3: AGI Dashboard UI

## Priority: MEDIUM | Status: COMPLETE | Parallel with Phase 2

## Overview
Upgrade AgentChat to show AGI reasoning steps. Aura Elite design system.

## Files to Modify

### 1. `src/components/Agent/AgentChat.tsx`
- Add reasoning step visualization below messages
- Show tool call cards inline
- Add "thinking" indicator during ReAct loop
- Keep backward compatible with non-AGI agents

## Files to Create

### 2. `src/components/Agent/AgentReasoningView.tsx`
- Displays Thought → Action → Observation chain
- Collapsible steps with Framer Motion animations
- Color-coded: Thought (purple), Action (blue), Observation (green)
- Glassmorphism cards matching Aura Elite

### 3. `src/components/Agent/AgentToolCallCard.tsx`
- Displays tool call with name, inputs, outputs
- Expandable JSON view for parameters
- Status indicator (loading/success/error)
- Icon per tool type

## Design (Aura Elite)
- Cards: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl`
- Thought text: `text-purple-300`
- Action text: `text-blue-300`
- Observation text: `text-emerald-300`

## Success Criteria
- [x] Reasoning steps render inline in chat
- [x] Tool calls show inputs/outputs
- [x] Animations smooth (Framer Motion)
- [x] Responsive on mobile
- [x] Aura Elite compliant
