import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { User } from "../../types"
import { Button } from "../../components/ui/Button"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { Badge } from "../../components/ui/Badge"

interface ColumnsProps {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export const getColumns = ({ onEdit, onDelete }: ColumnsProps): ColumnDef<User>[] => [
  {
    accessorKey: "full_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Họ tên
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-medium">{user.full_name?.charAt(0) || user.email.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="font-medium">{user.full_name || "N/A"}</div>
            <div className="text-xs text-slate-500">{user.email}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Vai trò",
    cell: ({ row }) => {
      return <Badge variant={row.original.role}>{row.original.role}</Badge>
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
            Ngày tham gia
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
      const user = row.original

      return (
        <div className="text-right">
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                 <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                   Sao chép ID
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => onEdit(user)}>
                   Chỉnh sửa
                 </DropdownMenuItem>
                 <DropdownMenuItem
                   className="text-red-600 dark:text-red-400"
                   onClick={() => onDelete(user)}
                 >
                   Vô hiệu hóa
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
        </div>
      )
    },
  },
]
