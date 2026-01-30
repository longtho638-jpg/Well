import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Distributor } from "../../types"
import { Button } from "../../components/ui/Button"
import { MoreHorizontal, ArrowUpDown, TrendingUp } from "lucide-react"
import { Badge } from "../../components/ui/Badge"
import { Link } from "react-router-dom"

export const columns: ColumnDef<Distributor>[] = [
  {
    accessorKey: "user.full_name",
    header: "Nhà phân phối",
    cell: ({ row }) => {
      const distributor = row.original
      const user = distributor.user
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-medium">{user?.full_name?.charAt(0) || "U"}</span>
            )}
          </div>
          <div>
            <div className="font-medium">{user?.full_name || "Unknown"}</div>
            <div className="text-xs text-slate-500">{user?.email}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "level",
    header: "Cấp bậc",
    cell: ({ row }) => {
      const level = row.original.level
      const colors = {
        bronze: "bg-orange-500/10 text-orange-600 border-orange-500/20",
        silver: "bg-slate-300/20 text-slate-600 border-slate-400/20",
        gold: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
        platinum: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
        diamond: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
      }
      return <Badge className={colors[level] || ""}>{level}</Badge>
    },
  },
  {
    accessorKey: "total_sales",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent"
          >
            Doanh số
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1 font-medium text-slate-900 dark:text-white">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.original.total_sales)}
            <TrendingUp className="w-3 h-3 text-teal-500" />
        </div>
      )
    },
  },
  {
    accessorKey: "commission_rate",
    header: "Hoa hồng",
    cell: ({ row }) => {
      return <span className="font-medium text-brand-primary dark:text-teal-400">{row.original.commission_rate}%</span>
    },
  },
  {
    accessorKey: "active",
    header: "Trạng thái",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${row.original.active ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-slate-600 dark:text-slate-400">{row.original.active ? 'Hoạt động' : 'Tạm khóa'}</span>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="text-right">
             <Link to={`/distributors/${row.original.id}`}>
                <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
             </Link>
        </div>
      )
    },
  },
]
