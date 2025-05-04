"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
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
    addIgnoredCategory: () => void;
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
            size: 100, // Set explicit width in pixels
        },
        {
            accessorKey: "name",
            header: "Name",
            size: 300, // Adjust based on your needs
            cell: ({ row }) => (
                <div className="max-w-[280px] truncate">{row.getValue("name")}</div>
            ),
        },
        {
            accessorKey: "category",
            header: "Category",
            size: 180, // Adjust based on your needs
            cell: ({ row }) => (
                <div className="max-w-[160px] truncate">{row.getValue("category")}</div>
            ),
        },
        {
            accessorKey: "amount",
            header: "Amount",
            size: 100, // Adjust based on your needs
            cell: ({ row }) => (
                <div className="text-right">{row.getValue("amount")}</div>
            ),
        },
    ];

    // Create table instance here so we can use it for both row data and header
    const table = useReactTable({
        data: filteredTransactions,
        columns,
        getCoreRowModel: getCoreRowModel(),
        // Enable column resizing (optional)
        columnResizeMode: 'onChange',
    });

    const { rows } = table.getRowModel();
    return (
        <div className="p-6 w-full">
            <div className="max-w-[1000px] w-full mx-auto space-y-6">
                {transactions.length > 0 && (
                    <>
                        <Card>
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
                                            <Badge key={category} variant="outline" className="flex items-center gap-1">
                                                {category}
                                                <button
                                                    onClick={() => removeIgnoredCategory(category)}
                                                    className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </Badge>
                                        ))}
                                        {ignoredCategories.length === 0 && (
                                            <p className="text-sm text-muted-foreground">No categories ignored</p>
                                        )}
                                    </div>

                                    <div>
                                        <Input
                                            list="categories"
                                            placeholder="Add category to ignore..."
                                            value={newCategory}
                                            onChange={e => {
                                                setNewCategory(e.target.value);
                                                // If the value matches a category, add it immediately
                                                const selectedValue = e.target.value;
                                                if (allCategories.includes(selectedValue) && !ignoredCategories.includes(selectedValue)) {
                                                    removeIgnoredCategory(selectedValue);
                                                    setNewCategory(""); // Clear the input after adding
                                                }
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    addIgnoredCategory();
                                                }
                                            }}
                                        />
                                        <datalist id="categories">
                                            {allCategories.map(category => (
                                                <option key={category} value={category} />
                                            ))}
                                        </datalist>
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

                        <div className="overflow-x-auto flex flex-col">
                            <div className="rounded-md border overflow-hidden">
                                <TableVirtuoso
                                    style={{ height: "400px" }}
                                    totalCount={rows.length}
                                    overscan={100}
                                    components={{
                                        Table: TableComponent,
                                        TableRow: TableRowComponent(rows),
                                    }}
                                    fixedHeaderContent={() => (
                                        <TableRow className="bg-card hover:bg-muted">
                                            {table.getHeaderGroups().map(headerGroup => (
                                                headerGroup.headers.map(header => (
                                                    <TableHead
                                                        key={header.id}
                                                        style={{
                                                            width: header.getSize(),
                                                            minWidth: header.getSize(),
                                                            maxWidth: header.getSize()
                                                        }}
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
                                                Total
                                            </TableCell>
                                            <TableCell
                                                className="text-right"
                                                style={{
                                                    width: columns[3].size,
                                                    minWidth: columns[3].size,
                                                    maxWidth: columns[3].size,
                                                }}
                                            >
                                                {filteredTotalAmount}
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}