"use client"
import { useState, useMemo, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Transactions } from "./transactions"
import { Graphs } from "./graphs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { repo } from "@/storage/repo"
import { usePersistentState } from "@/hooks/usePersistentState"
// import { AppPerformance } from "./components/app-performance"
// import { Insights } from "./components/insights"
// import { UserFeedback } from "./components/user-feedback"

// Transaction interface moved from Transactions component
export interface Transaction {
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
    /* ===== 1. persisted state ===== */
    const [transactions, setTransactions, txLoaded] =
        usePersistentState<Transaction[]>(repo.getTransactions, repo.setTransactions, [])

    const [ignoredCategories, setIgnoredCategories, ignLoaded] =
        usePersistentState<string[]>(repo.getIgnored, repo.setIgnored, [])

    const [totalAmount, setTotalAmount] = useState<string>("$0.00");
    const [newCategory, setNewCategory] = useState<string>("");

    // Filter transactions based on ignored categories and sort by date (newest first)
    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(transaction => !ignoredCategories.includes(transaction.category))
            .map(transaction => ({
                ...transaction,
                // Multiply amount by -1 to reverse sign
                amount: transaction.amount.startsWith('-')
                    ? transaction.amount.substring(1)
                    : transaction.amount.startsWith('$-')
                        ? '$' + transaction.amount.substring(2)
                        : '-' + transaction.amount
            }))
            .sort((a, b) => {
                // Sort by date in descending order (newest first)
                const dateA = new Date(a.originalDate || a.date);
                const dateB = new Date(b.originalDate || b.date);
                return dateB.getTime() - dateA.getTime();
            });
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
    const addIgnoredCategory = useCallback((categoryToAdd = newCategory) => {
        console.log("Adding ignored category:", categoryToAdd);
        if (categoryToAdd && !ignoredCategories.includes(categoryToAdd)) {
            setIgnoredCategories(prev => [...prev, categoryToAdd]);
            setNewCategory(""); // This clears the input after adding
        }
    }, [newCategory, ignoredCategories, setNewCategory]);

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

    // Calculate filtered totals with sign reversal already applied
    const filteredTotalAmount = useMemo(() => {
        let sum = 0;
        filteredTransactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount.replace('$', '').replace(',', ''));
            if (!isNaN(amount)) {
                sum += amount; // No need to negate since already reversed
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

    // File upload handler moved from Transactions
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

    /* ===== 2. reset handler ===== */
    const resetAll = async () => {
        if (confirm("This will wipe the stored data. Continue?")) {
            await repo.clearAll()
            setTransactions([])       // local state
            setIgnoredCategories([])
        }
    }

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-7xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Dashboard</h1>

                {transactions.length > 0 && (
                    <Button
                        variant="outline"
                        className="flex items-center gap-2 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        onClick={resetAll}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
                        Reset & Upload New CSV
                    </Button>
                )}
            </div>

            {/* File upload UI with improved design */}
            {transactions.length === 0 && (
                <div className="mb-6 p-8 border rounded-lg shadow-sm bg-gradient-to-br from-gray-50 to-gray-100 border-dashed border-gray-300">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Import Your Transaction Data</h2>
                    <div className="space-y-3 max-w-lg">
                        <Label htmlFor="csv-upload" className="text-sm font-medium">Upload Rocket Money CSV File</Label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                                id="csv-upload"
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="border-gray-300 focus:border-blue-500 hover:border-gray-400 transition-colors"
                            />
                            <Button type="button" className="bg-blue-600 hover:bg-blue-700 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                Upload
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500">Supported format: CSV exported from Rocket Money</p>
                    </div>
                </div>
            )}

            <Tabs defaultValue="transactions" className="space-y-6">
                <TabsList className="w-full max-w-md bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger value="transactions" className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2h13a2 2 0 0 0 2-2v-4Z" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></svg>
                        Transactions
                    </TabsTrigger>
                    <TabsTrigger value="graphs" className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M18 8H6" /><path d="M18 12H6" /><path d="M18 16H6" /></svg>
                        Graphs
                    </TabsTrigger>
                    {/* Other tab triggers with icons */}
                </TabsList>

                <TabsContent value="transactions" className="transition-all">
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
                {/* Other tab content */}
            </Tabs>
        </div>
    )
}