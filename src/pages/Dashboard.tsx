import { Suspense, useState } from "react";
import { FinancialCard } from "@/components/ui/financial-card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Gem,
  Calendar,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useDate } from "@/contexts/DateContext";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useIncomes } from "@/hooks/useIncomes";
import { useExpenses } from "@/hooks/useExpenses";
import { useDebts } from "@/hooks/useDebts";
import { useAssets } from "@/hooks/useAssets";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import { useFilteredData } from "@/hooks/useFilteredData";
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddIncomeForm } from "./Income";
import { AddExpenseForm } from "./Expenses";
import { AddDebtForm } from "./Debts";

export default function Dashboard() {
  const { formatCurrency } = useCurrency();
  const { selectedMonth, isCurrentMonth } = useDate();

  const { data: incomesData, isLoading: incomesLoading } = useIncomes();
  const { data: expensesData, isLoading: expensesLoading } = useExpenses();
  const { data: debtsData, isLoading: debtsLoading } = useDebts();
  const { data: assetsData, isLoading: assetsLoading } = useAssets();
  const { data: activities, isLoading: activitiesLoading, isError: activitiesError } = useRecentActivity(5);

  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);

  const incomes = useFilteredData(incomesData || []);
  const expenses = useFilteredData(expensesData || []);
  const debts = useFilteredData(debtsData || [], 'due_date');
  const assets = assetsData || [];

  const totalIncome = incomes.reduce((acc, i) => acc + i.amount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalDebt = debts.reduce((acc, d) => acc + d.amount, 0);
  const totalAssets = assets.reduce((acc, a) => acc + (a.quantity * a.price_per_unit), 0);

  const data = {
    balance: totalIncome - totalExpenses,
    income: totalIncome,
    expenses: totalExpenses,
    debt: totalDebt,
    assets: totalAssets,
    netWorth: totalAssets - totalDebt,
  };

  const isLoading = incomesLoading || expensesLoading || debtsLoading || assetsLoading;

  const getSubtitle = () => {
    if (selectedMonth === 'all') return 'Financial overview for all dates';
    if (isCurrentMonth()) return 'Overview of your financial health and current balance';
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return `Financial overview for ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`;
  };

  if (isLoading) {
      return <DashboardSkeleton />
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gradient-dashboard min-h-screen">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Financial Dashboard</h1>
        <p className="text-muted-foreground">{getSubtitle()}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <FinancialCard variant="balance" title="Available Balance" value={formatCurrency(data.balance)} subtitle="Ready to spend" icon={<DollarSign className="h-5 w-5" />} />
        <FinancialCard variant="income" title="Expected Income" value={formatCurrency(data.income)} subtitle="Next 30 days" icon={<TrendingUp className="h-5 w-5" />} />
        <FinancialCard variant="expense" title="Monthly Expenses" value={formatCurrency(data.expenses)} subtitle="Recurring + one-time" icon={<TrendingDown className="h-5 w-5" />} />
        <FinancialCard variant="debt" title="Short-term Debt" value={formatCurrency(data.debt)} subtitle="Due within 60 days" icon={<CreditCard className="h-5 w-5" />} />
        <FinancialCard variant="asset" title="Asset Value" value={formatCurrency(data.assets)} subtitle="Silver, crypto, etc." icon={<Gem className="h-5 w-5" />} />
        <FinancialCard title="Net Worth" value={formatCurrency(data.netWorth)} subtitle="Total assets - debts" icon={<Calendar className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gradient-card rounded-lg p-4 sm:p-6 border border-border shadow-card">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Dialog open={isAddIncomeOpen} onOpenChange={setIsAddIncomeOpen}>
              <DialogTrigger asChild>
                <button className="w-full p-3 text-left rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                  <div className="font-medium">Add Income</div>
                  <div className="text-sm text-muted-foreground">Record a new payment received</div>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add New Income</DialogTitle><DialogDescription>Record a new income entry to track your earnings.</DialogDescription></DialogHeader>
                <AddIncomeForm setDialogOpen={setIsAddIncomeOpen} />
              </DialogContent>
            </Dialog>
            <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
              <DialogTrigger asChild>
                <button className="w-full p-3 text-left rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors">
                  <div className="font-medium">Add Expense</div>
                  <div className="text-sm text-muted-foreground">Log a new expense</div>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add New Expense</DialogTitle><DialogDescription>Record a new expense to track your spending.</DialogDescription></DialogHeader>
                <AddExpenseForm setDialogOpen={setIsAddExpenseOpen} />
              </DialogContent>
            </Dialog>
            <Dialog open={isAddDebtOpen} onOpenChange={setIsAddDebtOpen}>
              <DialogTrigger asChild>
                <button className="w-full p-3 text-left rounded-lg bg-orange-500/10 hover:bg-orange-500/20 transition-colors">
                  <div className="font-medium">Add Debt</div>
                  <div className="text-sm text-muted-foreground">Manage your debts</div>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add New Debt</DialogTitle><DialogDescription>Record a new debt to track your liabilities.</DialogDescription></DialogHeader>
                <AddDebtForm setDialogOpen={setIsAddDebtOpen} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-gradient-card rounded-lg p-4 sm:p-6 border border-border shadow-card">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {activitiesLoading && (
                <>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </>
            )}
            {activitiesError && <p className="text-muted-foreground">Could not load recent activity.</p>}
            {!activitiesLoading && !activitiesError && activities && activities.length === 0 && (
                <p className="text-muted-foreground">No recent activity to display.</p>
            )}
            {!activitiesLoading && !activitiesError && activities && activities.map(activity => (
                <div key={activity.id} className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                        <CreditCard className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
    return (
        <div className="p-4 sm:p-6 space-y-6 bg-gradient-dashboard min-h-screen">
            <div className="space-y-2">
                <Skeleton className="h-8 w-72" />
                <Skeleton className="h-5 w-96" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Skeleton className="h-56" />
                <Skeleton className="h-56" />
            </div>
        </div>
    );
}