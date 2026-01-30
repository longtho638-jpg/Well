# Aura Elite Admin UI Research

## 1. Glassmorphism in Data Tables
**Goal:** High-end transparency without sacrificing readability.

*   **Container Styling:**
    *   Use `bg-zinc-950/80` or `bg-slate-900/70` with `backdrop-blur-xl` or `backdrop-blur-3xl`.
    *   Add a subtle border: `border border-white/5` or `border-zinc-800`.
    *   Rounded corners: `rounded-3xl` or `rounded-[2.5rem]` for the container.
*   **Header Styling:**
    *   Transparent or very low opacity background: `bg-white/[0.02]`.
    *   Text: Uppercase, tracking wide (`tracking-[0.2em]`), smaller font size (`text-[10px]`), bold/black font weight.
    *   Color: Muted zinc (`text-zinc-500` or `text-zinc-400`).
*   **Row Styling:**
    *   Hover effects are crucial: `hover:bg-white/[0.02]` or `hover:bg-zinc-800/30`.
    *   Transitions: `transition-all duration-500`.
    *   Cell padding: Generous (`p-6` or `p-8`) to maintain "airiness".
*   **Visual Hierarchy:**
    *   Primary text: White (`text-white`) or Brand Primary (`text-emerald-500` / `text-teal-500`) for values.
    *   Secondary text: `text-zinc-500` or `text-zinc-600` for labels/metadata.

## 2. Dark Gradient Backgrounds
**Goal:** Deep, immersive depth avoiding "flat" dark mode.

*   **Base Layer:** `bg-zinc-950` or `bg-slate-950` as the absolute base.
*   **Gradients:**
    *   **Spotlights:** Use `radial-gradient` for mouse-following effects (as seen in `BentoCard`).
    *   **Ambient Glows:** Large, blurred colored orbs (Deep Teal `#00575A` or Marigold `#FFBF00`) behind key areas with `blur-3xl` and `opacity-20`.
    *   **Overlay:** `bg-gradient-to-br from-white/5 to-white/10` for card surfaces.
*   **Grid Patterns:** Subtle grid overlays (`bg-grid-pattern`) with `mask-image: radial-gradient(...)` to fade edges.

## 3. Component Libraries
**Recommendation:** **Headless UI** or **Radix UI** + **Tailwind CSS**.

*   **Why:** existing `src/components/ui` suggests a custom implementation strategy. Pre-styled libraries (MUI, AntD) fight against the custom "Aura" look.
*   **Strategy:**
    *   Use **Radix UI** primitives for complex interactions (Dialogs, Popovers, Dropdowns) to ensure accessibility.
    *   Apply Aura tokens (`design-tokens.ts`) via Tailwind classes for styling.
    *   Use `framer-motion` for all state changes (entering/exiting modals, hover states).

## 4. Chart Styling (Recharts)
**Goal:** Charts that glow and blend into the dark theme.

*   **Gradients:** Use `<defs>` to create vertical linear gradients for Area charts (fading from color to transparent).
*   **Colors:**
    *   Stroke: Brand Primary (`#00575A` or brighter `#2DD4BF` for dark mode visibility).
    *   Active Dot: Brand Accent (`#FFBF00`).
*   **Grid:** Very subtle or invisible (`stroke="#F3F4F6"` with low opacity or `strokeDasharray="3 3"`).
*   **Tooltip:**
    *   Custom content style: Dark background (`#1F2937`), rounded corners (`rounded-xl`), border (`border-white/10`).
    *   Text: White text, colored labels matching the lines.
*   **Typography:** Axis labels should be small, uppercase, and muted (`fill: '#9CA3AF'`).

## 5. Color Accessibility
**Goal:** WCAG AA Compliance in a dark/glass environment.

*   **Text Contrast:**
    *   Pure White (`#FFFFFF`) on Zinc-950 passes AAA.
    *   Zinc-400 (`#A1A1AA`) on Zinc-950 passes AA.
    *   Avoid Zinc-600 for essential text on dark backgrounds.
*   **Status Colors:**
    *   Ensure "Success" Green and "Error" Red have sufficient brightness against dark backgrounds. Use `text-emerald-400` instead of `text-emerald-600`.
*   **Glass Borders:** Borders (`border-white/10`) help define boundaries for users with lower contrast sensitivity, rather than relying solely on shadow or background color differences.

## Unresolved Questions
*   Are there specific performance constraints for heavy use of `backdrop-blur` on mobile devices?
*   Should we implement a "Lite" mode for older devices that disables glass effects?
