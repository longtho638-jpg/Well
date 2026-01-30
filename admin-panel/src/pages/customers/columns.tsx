import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Customer } from "../../types"
import { Button } from "../../components/ui/Button"
import { MoreHorizontal, ArrowUpDown, ShoppingBag } from "lucide-react"
import { Link } from "react-router-dom"

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "full_name",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent"
          >
            Khách hàng
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    cell: ({ row }) => {
      const customer = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium">
             {customer.full_name?.charAt(0) || "C"}
          </div>
          <div>
            <div className="font-medium">{customer.full_name}</div>
            <div className="text-xs text-slate-500">{customer.phone}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "total_orders",
    header: "Đơn hàng",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
            <ShoppingBag className="w-3 h-3 text-slate-400" />
            <span>{row.original.total_orders}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "total_spent",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent"
          >
            Tổng chi tiêu
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    cell: ({ row }) => {
      return (
        <span className="font-medium text-slate-900 dark:text-white">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.original.total_spent)}
        </span>
      )
    },
  },
  {
    accessorKey: "last_order_date",
    header: "Mua gần nhất",
    cell: ({ row }) => {
      if (!row.original.last_order_date) return <span className="text-slate-400">-</span>
      return new Date(row.original.last_order_date).toLocaleDateString('vi-VN')
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="text-right">
             <Link to={`/customers/${row.original.id}`}>
                <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
             </Link>
        </div>
      )
    },
  },
]
