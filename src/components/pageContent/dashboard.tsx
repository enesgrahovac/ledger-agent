"use client"
import { useState, useMemo, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Transactions } from "./transactions"
import { Graphs } from "./graphs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
// import { AppPerformance } from "./components/app-performance"
// import { Insights } from "./components/insights"
// import { UserFeedback } from "./components/user-feedback"

// Transaction interface moved from Transactions component
interface Transaction {
    date: string;
    originalDate: string;
    accountType: string;
    accountName: string;
    accountNumber: string;
    institutionName: string;
    name: string;
    customName: string;
    amount: string;
    description: string;
    category: string;
    note: string;
    ignoredFrom: string;
    taxDeductible: string;
}

export function Dashboard() {
    // Lifted state from Transactions component
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [totalAmount, setTotalAmount] = useState<string>("$0.00");
    const [ignoredCategories, setIgnoredCategories] = useState<string[]>([]);
    const [newCategory, setNewCategory] = useState<string>("");

    // Filter transactions based on ignored categories
    const filteredTransactions = useMemo(() => {
        return transactions.filter(transaction =>
            !ignoredCategories.includes(transaction.category)
        );
    }, [transactions, ignoredCategories]);

    // Create chart data
    const chartData = useMemo(() => {
        if (filteredTransactions.length === 0) return { categoryData: [], timeData: [], colorMap: {} };

        // Aggregate by category
        const categoryMap = new Map<string, number>();
        // Aggregate by date
        const dateMap = new Map<string, number>();
        // Create a color map for consistent category colors
        const colorMap: Record<string, string> = {};

        // Chart colors
        const colors = [
            "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe",
            "#00C49F", "#FFBB28", "#FF8042", "#a4de6c", "#d0ed57"
        ];

        filteredTransactions.forEach(transaction => {
            // Process category data
            const category = transaction.category || "Uncategorized";
            const amount = parseFloat(transaction.amount.replace('$', '').replace(',', ''));

            if (!isNaN(amount)) {
                categoryMap.set(category, (categoryMap.get(category) || 0) + Math.abs(amount));

                // Process date data - extract month/year for time series
                const date = new Date(transaction.originalDate || transaction.date);
                if (!isNaN(date.getTime())) {
                    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
                    dateMap.set(monthYear, (dateMap.get(monthYear) || 0) + amount);
                }

                // Assign consistent colors to categories
                if (!colorMap[category]) {
                    const colorIndex = Object.keys(colorMap).length % colors.length;
                    colorMap[category] = colors[colorIndex];
                }
            }
        });

        // Convert maps to arrays for recharts
        const categoryData = Array.from(categoryMap, ([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10 categories

        const timeData = Array.from(dateMap, ([date, value]) => ({ date, value }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { categoryData, timeData, colorMap };
    }, [filteredTransactions]);

    // Add unique category to ignored list
    const addIgnoredCategory = useCallback(() => {
        if (newCategory && !ignoredCategories.includes(newCategory)) {
            setIgnoredCategories(prev => [...prev, newCategory]);
            setNewCategory("");
        }
    }, [newCategory, ignoredCategories]);

    // Remove category from ignored list
    const removeIgnoredCategory = useCallback((category: string) => {
        setIgnoredCategories(prev => prev.filter(c => c !== category));
    }, []);

    // Get all unique categories from transactions
    const allCategories = useMemo(() => {
        const categories = new Set<string>();
        transactions.forEach(transaction => {
            if (transaction.category) {
                categories.add(transaction.category);
            }
        });
        return Array.from(categories).sort();
    }, [transactions]);

    // Calculate filtered totals
    const filteredTotalAmount = useMemo(() => {
        let sum = 0;
        filteredTransactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount.replace('$', '').replace(',', ''));
            if (!isNaN(amount)) {
                sum += amount;
            }
        });
        return `$${sum.toFixed(2)}`;
    }, [filteredTransactions]);

    // CSV parsing function moved from Transactions
    const parseCSV = (text: string): string[][] => {
        const result: string[][] = [];
        let row: string[] = [];
        let currentValue = '';
        let insideQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    // Handle escaped quotes (double quotes)
                    currentValue += '"';
                    i++; // Skip the next quote
                } else {
                    // Toggle insideQuotes flag
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                // End of field
                row.push(currentValue.trim());
                currentValue = '';
            } else if ((char === '\r' && nextChar === '\n') && !insideQuotes) {
                // Windows line ending
                row.push(currentValue.trim());
                result.push(row);
                row = [];
                currentValue = '';
                i++; // Skip the \n
            } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                // Unix/Mac line ending
                row.push(currentValue.trim());
                result.push(row);
                row = [];
                currentValue = '';
            } else {
                currentValue += char;
            }
        }

        // Add the last row if there is one
        if (row.length > 0 || currentValue.length > 0) {
            row.push(currentValue.trim());
            result.push(row);
        }

        return result;
    };

    // File upload handler moved from Transactions component
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const parsedData = parseCSV(text);

            if (parsedData.length < 2) {
                console.error("Invalid CSV: Not enough rows");
                return;
            }

            const headers = parsedData[0];
            const parsedTransactions: Transaction[] = [];
            let sum = 0;

            // Map header indices for more reliable parsing
            const headerIndices: { [key: string]: number } = {};
            headers.forEach((header, index) => {
                headerIndices[header.trim()] = index;
            });

            // Parse each row starting from index 1 (skipping headers)
            for (let i = 1; i < parsedData.length; i++) {
                const row = parsedData[i];

                // Skip empty rows
                if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

                // Create transaction object using header indices
                const transaction: Transaction = {
                    date: row[headerIndices['Date']] || '',
                    originalDate: row[headerIndices['Original Date']] || '',
                    accountType: row[headerIndices['Account Type']] || '',
                    accountName: row[headerIndices['Account Name']] || '',
                    accountNumber: row[headerIndices['Account Number']] || '',
                    institutionName: row[headerIndices['Institution Name']] || '',
                    name: row[headerIndices['Name']] || '',
                    customName: row[headerIndices['Custom Name']] || '',
                    amount: row[headerIndices['Amount']] || '',
                    description: row[headerIndices['Description']] || '',
                    category: row[headerIndices['Category']] || '',
                    note: row[headerIndices['Note']] || '',
                    ignoredFrom: row[headerIndices['Ignored From']] || '',
                    taxDeductible: row[headerIndices['Tax Deductible']] || '',
                };

                // Add to total (convert to number)
                const amount = parseFloat(transaction.amount.replace('$', '').replace(',', ''));
                if (!isNaN(amount)) {
                    sum += amount;
                }

                parsedTransactions.push(transaction);
            }

            setTransactions(parsedTransactions);
            setTotalAmount(`$${sum.toFixed(2)}`);
        };

        reader.readAsText(file);
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

            {/* File upload UI - visible regardless of which tab is selected */}
            {transactions.length === 0 && (
                <div className="mb-6 p-6 border rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Import Data</h2>
                    <div className="space-y-2">
                        <Label htmlFor="csv-upload">Upload Rocket Money CSV</Label>
                        <div className="flex gap-2">
                            <Input
                                id="csv-upload"
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                            />
                            <Button type="button">Upload</Button>
                        </div>
                    </div>
                </div>
            )}

            <Tabs defaultValue="transactions" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="graphs">Graphs</TabsTrigger>
                    {/* <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="user-feedback">User Feedback</TabsTrigger> */}
                </TabsList>
                <TabsContent value="transactions">
                    <Transactions
                        transactions={transactions}
                        filteredTransactions={filteredTransactions}
                        totalAmount={totalAmount}
                        filteredTotalAmount={filteredTotalAmount}
                        ignoredCategories={ignoredCategories}
                        newCategory={newCategory}
                        setNewCategory={setNewCategory}
                        addIgnoredCategory={addIgnoredCategory}
                        removeIgnoredCategory={removeIgnoredCategory}
                        allCategories={allCategories}
                    />
                </TabsContent>
                <TabsContent value="graphs">
                    <Graphs
                        chartData={chartData}
                        filteredTransactions={filteredTransactions}
                    />
                </TabsContent>
                {/* <TabsContent value="insights">
                    <Insights />
                </TabsContent>
                <TabsContent value="user-feedback">
                    <UserFeedback />
                </TabsContent> */}
            </Tabs>
        </div>
    )
}