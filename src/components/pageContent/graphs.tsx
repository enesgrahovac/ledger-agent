"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts"

interface GraphsProps {
    chartData: {
        categoryData: { name: string, value: number }[];
        timeData: { date: string, value: number }[];
        colorMap: Record<string, string>;
    };
    filteredTransactions: any[];
}

export function Graphs({ chartData, filteredTransactions }: GraphsProps) {
    return (
        <div className="w-full mx-auto space-y-6">
            {filteredTransactions.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction Analytics</CardTitle>
                        <CardDescription>
                            Visual representation of your spending patterns
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="category" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="category">By Category</TabsTrigger>
                                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                <TabsTrigger value="pie">Distribution</TabsTrigger>
                            </TabsList>

                            <TabsContent value="category" className="mt-4">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData.categoryData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                            <YAxis
                                                tickFormatter={(value) => `$${value}`}
                                            />
                                            <Tooltip
                                                formatter={(value) => {
                                                    if (typeof value === 'number') {
                                                        return [`$${value.toFixed(2)}`, 'Amount'];
                                                    }
                                                    return [`${value}`, 'Amount'];
                                                }}
                                            />
                                            <Bar
                                                dataKey="value"
                                                fill="#8884d8"
                                                name="Amount"
                                                radius={[4, 4, 0, 0]}
                                            >
                                                {chartData.categoryData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={chartData.colorMap[entry.name]}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </TabsContent>

                            <TabsContent value="timeline" className="mt-4">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData.timeData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis
                                                tickFormatter={(value) => `$${value}`}
                                            />
                                            <Tooltip
                                                formatter={(value) => {
                                                    if (typeof value === 'number') {
                                                        return [`$${value.toFixed(2)}`, 'Amount'];
                                                    }
                                                    return [`${value}`, 'Amount'];
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#8884d8"
                                                name="Amount"
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </TabsContent>

                            <TabsContent value="pie" className="mt-4">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData.categoryData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {chartData.categoryData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={chartData.colorMap[entry.name]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => {
                                                    if (typeof value === 'number') {
                                                        return [`$${value.toFixed(2)}`, 'Amount'];
                                                    }
                                                    return [`${value}`, 'Amount'];
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            ) : (
                <div className="text-center p-10">
                    <p className="text-muted-foreground">Upload a CSV file to view graphs</p>
                </div>
            )}
        </div>
    )
}