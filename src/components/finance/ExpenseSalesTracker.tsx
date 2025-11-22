"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Plus, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { ExpenseForm } from "./ExpenseForm";
import { SaleForm } from "./SaleForm";
import type { Expense, Sale } from "@/types";

export function ExpenseSalesTracker() {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"expenses" | "sales">("expenses");
  const queryClient = useQueryClient();

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const { data: expensesData, isLoading: expensesLoading } = useQuery<{ expenses: Expense[] }>({
    queryKey: ["expenses", monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/expenses?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json();
    },
  });

  const { data: salesData, isLoading: salesLoading } = useQuery<{ sales: Sale[] }>({
    queryKey: ["sales", monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/sales?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch sales");
      return res.json();
    },
  });

  const expenses = expensesData?.expenses || [];
  const sales = salesData?.sales || [];

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const profit = totalSales - totalExpenses;

  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const typeTotals = sales.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + s.total;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Finance Tracker</h2>
          <p className="text-muted-foreground">
            Track expenses and sales for your farm
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExpenseForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
          <Button onClick={() => setShowSaleForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Sale
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              PKR {totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              PKR {totalSales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              PKR {profit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {showExpenseForm && (
        <ExpenseForm
          onClose={() => setShowExpenseForm(false)}
          onSuccess={() => {
            setShowExpenseForm(false);
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
          }}
        />
      )}

      {showSaleForm && (
        <SaleForm
          onClose={() => setShowSaleForm(false)}
          onSuccess={() => {
            setShowSaleForm(false);
            queryClient.invalidateQueries({ queryKey: ["sales"] });
          }}
        />
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "expenses" | "sales")}>
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          {expensesLoading ? (
            <div className="text-center py-8">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No expenses recorded this month</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                {Object.entries(categoryTotals).map(([category, total]) => (
                  <Card key={category}>
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium capitalize">{category}</div>
                      <div className="text-2xl font-bold">PKR {total.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-2">
                {expenses.map((expense) => (
                  <Card key={expense.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{expense.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(expense.date), "MMM d, yyyy")} •{" "}
                            <span className="capitalize">{expense.category}</span>
                          </div>
                        </div>
                        <div className="text-lg font-bold">PKR {expense.amount.toLocaleString()}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          {salesLoading ? (
            <div className="text-center py-8">Loading sales...</div>
          ) : sales.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No sales recorded this month</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                {Object.entries(typeTotals).map(([type, total]) => (
                  <Card key={type}>
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium capitalize">{type}</div>
                      <div className="text-2xl font-bold">PKR {total.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-2">
                {sales.map((sale) => (
                  <Card key={sale.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">
                            {sale.quantity} {sale.unit} of {sale.type}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(sale.date), "MMM d, yyyy")}
                            {sale.buyer && ` • Buyer: ${sale.buyer}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">PKR {sale.total.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">
                            @ PKR {sale.price.toLocaleString()}/{sale.unit}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

