import React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  OnChangeFn,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table" // We need to create this primitive wrapper first or just inline it
import { Button } from "./Button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "../../lib/utils"

// Since I haven't created the Table primitive components (shadcn/ui style),
// I will create them inline or better yet, create a separate file for them first
// to keep it clean. But for now, let's implement the logic in DataTable and
// standard HTML table elements with Tailwind classes matching Aura Elite.

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount: number
  pageIndex: number
  pageSize: number
  onPaginationChange: (pageIndex: number, pageSize: number) => void
  onSortingChange?: OnChangeFn<SortingState>
  sorting?: SortingState
  isLoading?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pageIndex,
  pageSize,
  onPaginationChange,
  onSortingChange,
  sorting,
  isLoading,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pageCount,
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
      sorting,
    },
    onPaginationChange: (updater) => {
        if (typeof updater === 'function') {
            const newState = updater({ pageIndex, pageSize });
            onPaginationChange(newState.pageIndex, newState.pageSize);
        } else {
            onPaginationChange(updater.pageIndex, updater.pageSize);
        }
    },
    onSortingChange,
    manualSorting: true,
  })

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/20 dark:border-white/5 overflow-hidden bg-white/50 dark:bg-zinc-900/40 backdrop-blur-sm">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="[&_tr]:border-b border-white/10 dark:border-white/5">
              <tr className="border-b transition-colors hover:bg-white/5 data-[state=selected]:bg-white/5">
                {table.getHeaderGroups().map((headerGroup) => (
                  <React.Fragment key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <th
                          key={header.id}
                          className="h-12 px-4 align-middle font-medium text-slate-500 dark:text-slate-400 [&:has([role=checkbox])]:pr-0 cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      )
                    })}
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading ? (
                <tr className="border-b border-white/10 dark:border-white/5">
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading data...
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b border-white/10 dark:border-white/5 transition-colors hover:bg-white/40 dark:hover:bg-white/5 data-[state=selected]:bg-white/10"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-slate-700 dark:text-slate-300"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-slate-500 dark:text-slate-400"
                  >
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-slate-500 dark:text-slate-400">
           Page {pageIndex + 1} of {pageCount > 0 ? pageCount : 1}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
