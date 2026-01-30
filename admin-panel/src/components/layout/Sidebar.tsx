import * as React from "react"
import { NavLink } from "react-router-dom"
import { cn } from "../../lib/utils"
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from "lucide-react"
import { GlassCard } from "../ui/GlassCard"

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Users, label: "Người dùng", path: "/users" },
    { icon: Store, label: "Nhà phân phối", path: "/distributors" },
    { icon: Users, label: "Khách hàng", path: "/customers" },
    { icon: ShoppingBag, label: "Đơn hàng", path: "/orders" },
    { icon: BarChart3, label: "Báo cáo", path: "/analytics" },
    { icon: Settings, label: "Cài đặt", path: "/settings" },
  ]

  return (
    <aside
      className={cn(
        "relative z-40 h-screen transition-all duration-300 ease-in-out border-r border-white/20 dark:border-white/5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-white/10 dark:border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className={cn(
              "font-display font-bold text-xl text-slate-900 dark:text-white whitespace-nowrap transition-opacity duration-300",
              collapsed ? "opacity-0 w-0" : "opacity-100"
            )}>
              Admin <span className="text-teal-500">Panel</span>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-brand-primary/10 text-brand-primary dark:text-teal-400 font-medium"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive ? "text-brand-primary dark:text-teal-400" : "text-current"
                  )} />

                  <span className={cn(
                    "whitespace-nowrap transition-all duration-300",
                    collapsed ? "opacity-0 w-0 translate-x-4" : "opacity-100 translate-x-0"
                  )}>
                    {item.label}
                  </span>

                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-primary dark:bg-teal-500 rounded-r-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Toggle */}
        <div className="p-4 border-t border-white/10 dark:border-white/5">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </aside>
  )
}
