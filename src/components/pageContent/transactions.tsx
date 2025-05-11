"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    ColumnDef,
    SortDirection,
    SortingState,
    Row,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { TableVirtuoso } from "react-virtuoso";
import { HTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@/lib/utils";


// Define props interface
interface TransactionProps {
    transactions: any[];
    filteredTransactions: any[];
    totalAmount: string;
    filteredTotalAmount: string;
    ignoredCategories: string[];
    newCategory: string;
    setNewCategory: (value: string) => void;
    addIgnoredCategory: (category?: string) => void;
    removeIgnoredCategory: (category: string) => void;
    allCategories: string[];
}

// Table component without the wrapping div
const TableComponent = forwardRef<
    HTMLTableElement,
    React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
    <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
    />
));
TableComponent.displayName = "TableComponent";

// Row renderer function
const TableRowComponent = <TData,>(rows: Row<TData>[]) =>
    function getTableRow(props: HTMLAttributes<HTMLTableRowElement>) {
        // @ts-expect-error data-index is a valid attribute
        const index = props["data-index"];
        const row = rows[index];

        if (!row) return null;

        return (
            <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                {...props}
            >
                {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                ))}
            </TableRow>
        );
    };

function SortingIndicator({ isSorted }: { isSorted: SortDirection | false }) {
    if (!isSorted) return null;
    return (
        <div>
            {
                {
                    asc: "↑",
                    desc: "↓",
                }[isSorted]
            }
        </div>
    );
}

export function Transactions({
    transactions,
    filteredTransactions,
    totalAmount,
    filteredTotalAmount,
    ignoredCategories,
    newCategory,
    setNewCategory,
    addIgnoredCategory,
    removeIgnoredCategory,
    allCategories,
}: TransactionProps) {
    // Column definitions for the table
    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "originalDate",
            header: "Date",
            size: 100,
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("originalDate")}</div>
            ),
        },
        {
            accessorKey: "name",
            header: "Name",
            size: 300,
            cell: ({ row }) => (
                <div className="max-w-[280px] truncate font-medium">{row.getValue("name")}</div>
            ),
        },
        {
            accessorKey: "category",
            header: "Category",
            size: 180,
            cell: ({ row }) => {
                const category = row.getValue("category") as string;
                return (
                    <Badge variant="outline" className="bg-slate-50">
                        {category || "Uncategorized"}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "amount",
            header: "Amount",
            size: 100,
            cell: ({ row }) => {
                const amount = row.getValue("amount") as string;
                const value = parseFloat(amount.replace('$', '').replace(',', ''));
                return (
                    <div className={`text-right font-medium ${value < 0 ? 'text-red-500' : value > 0 ? 'text-green-500' : ''}`}>
                        {amount}
                    </div>
                );
            },
        },
    ];

    // Create table instance
    const table = useReactTable({
        data: filteredTransactions,
        columns,
        getCoreRowModel: getCoreRowModel(),
        columnResizeMode: 'onChange',
    });

    const { rows } = table.getRowModel();
    return (
        <div className="space-y-6">
            {/* Stats summary */}
            {transactions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{transactions.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Filtered Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
                            {ignoredCategories.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Hiding {transactions.length - filteredTransactions.length} transactions
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalAmount}</div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Filtered Amount</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${parseFloat(filteredTotalAmount.replace('$', '')) < 0 ? 'text-red-500' : parseFloat(filteredTotalAmount.replace('$', '')) > 0 ? 'text-green-500' : ''}`}>
                                {filteredTotalAmount}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {transactions.length > 0 && (
                <>
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Categories to Ignore</CardTitle>
                            <CardDescription>
                                Select categories to exclude from analysis and view
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {ignoredCategories.map(category => (
                                        <Badge key={category} variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                                            {category}
                                            <button
                                                onClick={() => removeIgnoredCategory(category)}
                                                className="ml-1 rounded-full hover:bg-slate-200 p-1 transition-colors"
                                                aria-label={`Remove ${category}`}
                                            >
                                                <X size={12} />
                                            </button>
                                        </Badge>
                                    ))}
                                    {ignoredCategories.length === 0 && (
                                        <p className="text-sm text-muted-foreground">No categories ignored</p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            list="categories"
                                            placeholder="Add category to ignore..."
                                            value={newCategory}
                                            onChange={e => {
                                                const selectedValue = e.target.value;
                                                setNewCategory(selectedValue);

                                                // If the value matches a category, add it immediately
                                                if (allCategories.includes(selectedValue) && !ignoredCategories.includes(selectedValue)) {
                                                    addIgnoredCategory(selectedValue);
                                                }
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && newCategory && !ignoredCategories.includes(newCategory)) {
                                                    addIgnoredCategory(newCategory);
                                                    e.preventDefault();
                                                }
                                            }}
                                            className="w-full"
                                        />
                                        <datalist id="categories">
                                            {allCategories.map(category => (
                                                <option key={category} value={category} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                {ignoredCategories.length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Hiding {transactions.length - filteredTransactions.length} transactions
                                        ({(100 - (filteredTransactions.length / transactions.length * 100)).toFixed(1)}% of total)
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm overflow-hidden">
                        <CardHeader className="pb-0">
                            <CardTitle>Transactions</CardTitle>
                            <CardDescription>
                                Showing {filteredTransactions.length} of {transactions.length} total transactions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="border-t mt-4 overflow-x-auto flex flex-col">
                                <div className="overflow-hidden">
                                    <TableVirtuoso
                                        style={{ height: "400px" }}
                                        totalCount={rows.length}
                                        overscan={10}
                                        components={{
                                            Table: TableComponent,
                                            TableRow: TableRowComponent(rows),
                                        }}
                                        fixedHeaderContent={() => (
                                            <TableRow className="bg-muted/50 hover:bg-muted">
                                                {table.getHeaderGroups().map(headerGroup => (
                                                    headerGroup.headers.map(header => (
                                                        <TableHead
                                                            key={header.id}
                                                            style={{
                                                                width: header.getSize(),
                                                                minWidth: header.getSize(),
                                                                maxWidth: header.getSize()
                                                            }}
                                                            className="font-medium text-xs uppercase tracking-wider"
                                                        >
                                                            {header.isPlaceholder ? null : (
                                                                flexRender(
                                                                    header.column.columnDef.header,
                                                                    header.getContext()
                                                                )
                                                            )}
                                                        </TableHead>
                                                    ))
                                                ))}
                                            </TableRow>
                                        )}
                                    />

                                    {/* Footer integrated within the same container */}
                                    <Table className="w-full border-t">
                                        <TableFooter>
                                            <TableRow>
                                                <TableCell
                                                    colSpan={3}
                                                    style={{
                                                        width: columns.slice(0, 3).reduce((acc, col) => acc + (col.size || 0), 0),
                                                    }}
                                                >
                                                    <span className="font-medium">Total</span>
                                                </TableCell>
                                                <TableCell
                                                    className="text-right"
                                                    style={{
                                                        width: columns[3].size,
                                                        minWidth: columns[3].size,
                                                        maxWidth: columns[3].size,
                                                    }}
                                                >
                                                    <span className={`font-bold ${parseFloat(filteredTotalAmount.replace('$', '')) < 0 ? 'text-red-500' : parseFloat(filteredTotalAmount.replace('$', '')) > 0 ? 'text-green-500' : ''}`}>
                                                        {filteredTotalAmount}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}