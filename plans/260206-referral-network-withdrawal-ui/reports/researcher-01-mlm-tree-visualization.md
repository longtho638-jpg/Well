# Research Report: F1-F7 Referral Tree Visualization Patterns

## 1. Executive Summary
For visualizing a 7-level deep Multi-Level Marketing (MLM) structure (F1-F7) with potential for 1000+ nodes, a **hybrid approach** is recommended. Use a dedicated tree visualization library for the desktop "God view" and a simplified **Nested Accordion/List** pattern for mobile devices.

Existing dependencies `framer-motion` and `lucide-react` should be leveraged for animations and icons. `recharts` (currently installed) is **unsuitable** for node-link diagrams and should be supplemented with `react-d3-tree` or `react-flow` for the main visualization.

## 2. Recommended Libraries

| Library | Type | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **react-d3-tree** | D3 Wrapper | Optimized for large trees, built-in zoom/pan, collapsible nodes. | Styling custom nodes can be tricky (foreignObject). | **Primary Choice** for desktop structure. |
| **React Flow** | Node Editor | Extremely customizable, excellent DnD, handles custom React components as nodes natively. | heavier bundle, maybe overkill if just viewing. | **Alternative** if complex interactions needed. |
| **VisX (Airbnb)** | Low-level D3 | Modular, React-native feel, lightweight. | Requires more boilerplate code. | Good for custom lightweight needs. |
| **Reaflow** | ELK-based | Auto-layout engine, supports large complex graphs. | Less animation control. | Good for massive static graphs. |

**Decision**: **`react-d3-tree`** is the standard for strict hierarchical data like MLM trees due to its performance with large datasets and built-in collapsing features.

## 3. Visualization Patterns

### A. Glassmorphism Card Layout (Node Design)
To match modern UI trends, nodes should use a glassmorphism effect.
**Tailwind CSS Implementation:**
```tsx
const GlassNode = ({ rank, name, sales }) => (
  <div className="
    relative overflow-hidden rounded-xl border border-white/20
    bg-white/10 backdrop-blur-md shadow-lg
    transition-all hover:bg-white/20 hover:scale-105
    p-4 min-w-[200px]
  ">
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
    <div className="flex items-center gap-3">
      <Avatar src={img} className="ring-2 ring-white/30" />
      <div>
        <h3 className="font-bold text-white drop-shadow-sm">{name}</h3>
        <Badge variant={rankColor[rank]}>{rank}</Badge>
      </div>
    </div>
    <div className="mt-2 text-xs text-white/80 font-mono">
      Vol: ${sales.toLocaleString()}
    </div>
  </div>
);
```

### B. Hierarchical Data Rendering (F1-F7)
- **Color Coding**: Distinct border/background colors for ranks (Member, Silver, Gold, Diamond).
- **Connector Lines**: Use SVG bezier curves with animated dashes to show active commission flow.
- **Level Indicators**: Visual depth markers (Z-axis or opacity fade) for lower levels (F6-F7).

## 4. Performance Optimization (1000+ Nodes)

Rendering 1000+ DOM nodes will lag.
1.  **Collapsible by Default**: Only expand F1 and F2 initially. Load F3+ on demand (lazy load).
2.  **Canvas/SVG vs DOM**: Use SVG (react-d3-tree) over HTML DOM nodes for the graph structure itself. HTML nodes are expensive.
3.  **Memoization**: Wrap Node components in `React.memo`.
4.  **Virtualization**: Not applicable to standard tree layouts easily, but "Drill Down" view (click to make node root) reduces distinct nodes on screen.

## 5. Mobile-Responsive Strategy

**Do not** attempt to show a massive horizontal tree on mobile.
1.  **Desktop**: Pan/Zoom Canvas (Standard Tree).
2.  **Mobile**: **Stacked List / Accordion**.
    - Transform tree data into a nested list.
    - Use `framer-motion` `AnimatePresence` for expanding children.
    - "Breadcrumb" navigation if drilling down.

**Mobile View Code Concept:**
```tsx
// Mobile recursive list
const MemberItem = ({ node }) => (
  <div className="pl-4 border-l border-white/10">
    <div className="flex justify-between py-2" onClick={toggle}>
      <span>{node.name}</span>
      <ChevronDown className={isOpen ? 'rotate-180' : ''} />
    </div>
    <AnimatePresence>
      {isOpen && node.children.map(child => <MemberItem node={child} />)}
    </AnimatePresence>
  </div>
)
```

## 6. Unresolved Questions
- Does the backend support fetching the tree by specific `depth` or `node_id` (lazy loading)?
- Are there circular references in this "referral" network (rare in MLM, but possible in "spillover" systems)?
- Do we need to edit the tree (move users) or just view it?

## 7. Sources
- React D3 Tree: https://github.com/bkrem/react-d3-tree
- Glassmorphism Generator: https://ui.glass
- React Flow Performance: https://reactflow.dev/docs/guides/optimization/
