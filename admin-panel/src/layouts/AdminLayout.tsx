import React, { useState } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "../components/layout/Sidebar"
import { Header } from "../components/layout/Header"
import { cn } from "../lib/utils"

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-dark-bg text-slate-900 dark:text-slate-100 flex overflow-hidden font-sans selection:bg-teal-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-primary/5 dark:bg-brand-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/5 dark:bg-teal-500/10 blur-[120px]" />
      </div>

      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className={cn(
            "max-w-7xl mx-auto transition-all duration-300",
            collapsed ? "max-w-[1600px]" : "max-w-7xl"
          )}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
