---
title: Phase 6 - Premium Visualizations
description: Premium charts, gauges, trends with Aura Elite design and export features
status: pending
priority: P2
effort: 2h
blockedBy: ['phase-03-revenue-dashboard', 'phase-05-roi-calculator']
---

# Phase 6: Premium Visualizations

## Overview

Add premium visualizations with Aura Elite glassmorphism design, advanced charts, and export functionality (PDF/CSV).

## Requirements

### Premium Charts
- Area charts with gradients
- Stacked bar charts
- Radial gauges

### Export Features
- Export dashboard to PDF
- Export data to CSV
- Print-friendly styles

### Aura Elite Design
- Glassmorphism effects
- Gradient backgrounds
- Smooth animations

## Implementation Steps

### 6.1 Create Advanced Area Chart

File: `src/components/analytics/PremiumAreaChart.tsx`

```typescript
/**
 * Premium Area Chart - gradient area chart with Aura Elite design
 */

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Defs, LinearGradient, Stop } from 'recharts'
import { cn } from '@/lib/utils'

interface PremiumAreaChartProps {
  data: { date: string; value: number }[]
  title?: string
  color?: string
  gradientFrom?: string
  gradientTo?: string
  className?: string
}

export function PremiumAreaChart({
  data,
  title,
  color = '#8b5cf6',
  gradientFrom = '#8b5cf6',
  gradientTo = 'transparent',
  className,
}: PremiumAreaChartProps) {
  const formatY = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return value.toFixed(0)
  }

  const formatX = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className={cn(
      'p-6 rounded-xl border border-white/10',
      'bg-gradient-to-br from-gray-800/50 to-gray-900/50',
      'backdrop-blur-sm hover:border-white/20 transition-all',
      className
    )}>
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Defs>
              <LinearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={gradientFrom} stopOpacity={0.4} />
                <Stop offset="100%" stopColor={gradientTo} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickFormatter={formatX}
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatY}
              stroke="#9ca3af"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)',
              }}
              labelStyle={{ color: '#fff', marginBottom: '0.5rem' }}
              formatter={(value: number) => [formatY(value), 'Value']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              fill="url(#colorGradient)"
              activeDot={{ r: 6, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

### 6.2 Create Radial Gauge

File: `src/components/analytics/RadialGauge.tsx`

```typescript
/**
 * Radial Gauge - circular progress gauge with Aura Elite styling
 */

import { cn } from '@/lib/utils'

interface RadialGaugeProps {
  value: number
  max?: number
  label?: string
  sublabel?: string
  color?: 'emerald' | 'blue' | 'purple' | 'amber' | 'red'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CONFIG = {
  sm: { width: 120, strokeWidth: 8, fontSize: 'text-xl' },
  md: { width: 160, strokeWidth: 10, fontSize: 'text-2xl' },
  lg: { width: 200, strokeWidth: 12, fontSize: 'text-3xl' },
}

const COLOR_CONFIG = {
  emerald: { from: '#10b981', to: '#34d399' },
  blue: { from: '#3b82f6', to: '#60a5fa' },
  purple: { from: '#8b5cf6', to: '#a78bfa' },
  amber: { from: '#f59e0b', to: '#fbbf24' },
  red: { from: '#ef4444', to: '#f87171' },
}

export function RadialGauge({
  value,
  max = 100,
  label,
  sublabel,
  color = 'blue',
  size = 'md',
  className,
}: RadialGaugeProps) {
  const config = SIZE_CONFIG[size]
  const colors = COLOR_CONFIG[color]
  const percentage = Math.min((value / max) * 100, 100)
  const radius = (config.width - config.strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn(
      'relative p-6 rounded-xl border border-white/10',
      'bg-gradient-to-br from-gray-800/50 to-gray-900/50',
      'backdrop-blur-sm hover:border-white/20 transition-all',
      className
    )}>
      <div className="flex flex-col items-center">
        {/* Gauge */}
        <div
          className="relative"
          style={{ width: config.width, height: config.width }}
        >
          <svg
            width={config.width}
            height={config.width}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={config.width / 2}
              cy={config.width / 2}
              r={radius}
              stroke="#374151"
              strokeWidth={config.strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx={config.width / 2}
              cy={config.width / 2}
              r={radius}
              stroke={`url(#gradient-${color})`}
              strokeWidth={config.strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={colors.from} />
                <stop offset="100%" stopColor={colors.to} />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('font-bold text-white', config.fontSize)}>
              {value.toLocaleString()}
            </span>
            {max && (
              <span className="text-xs text-gray-500 mt-0.5">
                / {max.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Labels */}
        {label && (
          <p className="text-sm text-gray-400 mt-4 text-center">{label}</p>
        )}
        {sublabel && (
          <p className="text-xs text-gray-500 mt-1 text-center">{sublabel}</p>
        )}
      </div>
    </div>
  )
}
```

### 6.3 Create Export Button

File: `src/components/analytics/ExportButton.tsx`

```typescript
/**
 * Export Button - export dashboard to PDF/CSV
 */

import { Download, FileText, Table } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ExportButtonProps {
  type?: 'pdf' | 'csv' | 'both'
  data?: any[]
  filename?: string
  className?: string
}

export function ExportButton({
  type = 'both',
  data,
  filename = 'dashboard-export',
  className,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const exportToCSV = () => {
    if (!data) return

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row =>
      Object.values(row).map(val => `"${val}"`).join(',')
    ).join('\n')

    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()

    URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
    // Use browser print for simplicity
    // For production, use @react-pdf/renderer or similar
    window.print()
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {(type === 'pdf' || type === 'both') && (
        <button
          onClick={exportToPDF}
          disabled={exporting}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-purple-500/10 border border-purple-500/30',
            'text-purple-400 hover:bg-purple-500/20',
            'transition-all disabled:opacity-50'
          )}
        >
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">PDF</span>
        </button>
      )}
      {(type === 'csv' || type === 'both') && (
        <button
          onClick={exportToCSV}
          disabled={exporting || !data}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-blue-500/10 border border-blue-500/30',
            'text-blue-400 hover:bg-blue-500/20',
            'transition-all disabled:opacity-50'
          )}
        >
          <Table className="w-4 h-4" />
          <span className="text-sm font-medium">CSV</span>
        </button>
      )}
    </div>
  )
}
```

### 6.4 Create Dashboard Header with Export

File: `src/components/analytics/DashboardHeader.tsx`

```typescript
/**
 * Dashboard Header - title, date range, export
 */

import { Calendar, Download } from 'lucide-react'
import { ExportButton } from './ExportButton'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  dateRange?: { start: string; end: string }
  onExport?: () => void
}

export function DashboardHeader({
  title,
  subtitle,
  dateRange,
  onExport,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="text-gray-400 mt-1">{subtitle}</p>
        )}
        {dateRange && (
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(dateRange.start).toLocaleDateString('vi-VN')}
              {' - '}
              {new Date(dateRange.end).toLocaleDateString('vi-VN')}
            </span>
          </div>
        )}
      </div>

      <ExportButton type="both" />
    </div>
  )
}
```

### 6.5 Add Print Styles

File: `src/index.css` (add)

```css
/* Print Styles for Dashboard Export */
@media print {
  /* Hide non-essential elements */
  nav,
  aside,
  button:not([data-print-keep]),
  .no-print {
    display: none !important;
  }

  /* Force light background for printing */
  body {
    background: white !important;
    color: black !important;
  }

  /* Ensure cards have borders */
  [class*='rounded-xl'] {
    border: 1px solid #ccc !important;
    background: white !important;
  }

  /* Full width for print */
  .grid {
    display: block !important;
  }

  /* Page breaks */
  .print-page-break {
    page-break-before: always;
  }
}
```

## Todo List

- [ ] Create `PremiumAreaChart.tsx`
- [ ] Create `RadialGauge.tsx`
- [ ] Create `ExportButton.tsx`
- [ ] Create `DashboardHeader.tsx`
- [ ] Add print styles to index.css
- [ ] Test PDF export in browser
- [ ] Test CSV export with real data

## Success Criteria

- [ ] All charts render with gradients
- [ ] Export buttons work
- [ ] Print styles apply correctly
- [ ] Aura Elite design consistent

## Dependencies

- **Blocked by:** Phase 3 (Revenue Dashboard) + Phase 5 (ROI Calculator)

---

_Effort: 2h | Priority: P2 | Status: Ready_
