import React from "react"
import { Bell, Search, User } from "lucide-react"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { GlassCard } from "../ui/GlassCard"

export function Header() {
  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-white/20 dark:border-white/5 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-30 transition-all duration-300">
      {/* Search */}
      <div className="w-96 hidden md:block">
        <Input
          placeholder="Tìm kiếm..."
          icon={<Search className="w-4 h-4" />}
          className="bg-white/50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black/40"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-slate-500 dark:text-slate-400">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900" />
        </Button>

        <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-1" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Admin User</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Founder</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  )
}
