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

                        <div className="overflow-x-auto">
                            <Table className="w-full">
                                <TableCaption>A list of your recent transactions.</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.map((transaction, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{transaction.originalDate}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">{transaction.name}</TableCell>
                                            <TableCell>{transaction.category}</TableCell>
                                            <TableCell className="text-right">{transaction.amount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={3}>Total</TableCell>
                                        <TableCell className="text-right">{filteredTotalAmount}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}