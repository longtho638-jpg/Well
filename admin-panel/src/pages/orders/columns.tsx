import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Order } from "../../types"
import { Button } from "../../components/ui/Button"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Badge } from "../../components/ui/Badge"
import { Link } from "react-router-dom"

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: "Mã đơn hàng",
    cell: ({ row }) => {
      return <span className="font-mono text-xs">#{row.original.id.slice(0, 8)}</span>
    },
  },
  {
    accessorKey: "customer.full_name",
    header: "Khách hàng",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.original.customer?.full_name || "Khách lẻ"}
        </div>
      )
    },
  },
  {
    accessorKey: "total_amount",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent"
          >
            Tổng tiền
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    cell: ({ row }) => {
      return (
        <span className="font-medium text-slate-900 dark:text-white">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.original.total_amount)}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.original.status
      const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        pending: "secondary",
        processing: "outline",
        shipped: "default",
        delivered: "default", // will custom color
        cancelled: "destructive",
        returned: "destructive",
      }

      const styles = {
        pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        shipped: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        delivered: "bg-green-500/10 text-green-600 border-green-500/20",
        cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
        returned: "bg-red-500/10 text-red-600 border-red-500/20",
      }

      return <Badge className={styles[status] || ""}>{status}</Badge>
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent"
          >
            Ngày tạo
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    cell: ({ row }) => {
      return new Date(row.original.created_at).toLocaleDateString('vi-VN')
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="text-right">
             <Link to={`/orders/${row.original.id}`}>
                <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
             </Link>
        </div>
      )
    },
  },
]
