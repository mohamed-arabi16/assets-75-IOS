import { useState } from "react";
import { DateFilterSelector } from "@/components/DateFilterSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useFilteredData } from "@/hooks/useFilteredData";
import { useExpenses, useAddExpense, useUpdateExpense, useDeleteExpense, Expense } from "@/hooks/useExpenses";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { FinancialCard } from "@/components/ui/financial-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, Home, Car, Calendar as CalendarIcon, Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const expenseSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
  currency: z.string().default("USD"),
  category: z.string().min(1, { message: "Please select a category." }),
  type: z.enum(['fixed', 'variable']),
  status: z.enum(['paid', 'pending']),
  date: z.date({ required_error: "A date is required." }),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const { data: expensesData, isLoading, isError } = useExpenses();
  const expenses = expensesData || [];
  const [activeTab, setActiveTab] = useState("fixed");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const { formatCurrency, convertCurrency, currency } = useCurrency();

  const filteredExpensesByMonth = useFilteredData(expenses);

  const fixedExpenses = filteredExpensesByMonth.filter((expense) => expense.type === "fixed");
  const variableExpenses = filteredExpensesByMonth.filter((expense) => expense.type === "variable");

  const totalFixed = fixedExpenses.reduce((sum, expense) => sum + convertCurrency(expense.amount, expense.currency), 0);
  const totalVariable = variableExpenses.reduce((sum, expense) => sum + convertCurrency(expense.amount, expense.currency), 0);
  const totalPaid = filteredExpensesByMonth.filter((e) => e.status === "paid").reduce((sum, e) => sum + convertCurrency(e.amount, e.currency), 0);
  const totalPending = filteredExpensesByMonth.filter((e) => e.status === "pending").reduce((sum, e) => sum + convertCurrency(e.amount, e.currency), 0);

  const filteredExpenses = activeTab === "fixed" ? fixedExpenses : variableExpenses;

  if (isLoading) {
    return <ExpensePageSkeleton />;
  }

  if (isError) {
    return <div className="p-6 text-red-500">Error loading expenses.</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-dashboard min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Expense Management</h1>
          <p className="text-muted-foreground">Track and manage your fixed and variable expenses</p>
        </div>
        <div className="flex items-center gap-4">
          <DateFilterSelector />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Record a new expense to track your spending.</DialogDescription>
              </DialogHeader>
              <AddExpenseForm setDialogOpen={setIsAddDialogOpen} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinancialCard variant="expense" title="Fixed Expenses" value={formatCurrency(totalFixed, currency)} subtitle="Monthly recurring" icon={<Home className="h-5 w-5" />} />
        <FinancialCard variant="debt" title="Variable Expenses" value={formatCurrency(totalVariable, currency)} subtitle="Fluctuating costs" icon={<ShoppingCart className="h-5 w-5" />} />
        <FinancialCard variant="income" title="Total Paid" value={formatCurrency(totalPaid, currency)} subtitle="Completed payments" icon={<CalendarIcon className="h-5 w-5" />} />
        <FinancialCard variant="asset" title="Total Pending" value={formatCurrency(totalPending, currency)} subtitle="Awaiting payment" icon={<Car className="h-5 w-5" />} />
      </div>

      <div className="bg-gradient-card rounded-xl border border-border shadow-card">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Expense Overview</h2>
          <p className="text-muted-foreground">View and manage all your expenses</p>
        </div>
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-fit grid-cols-2 bg-[#E9F4F4] dark:bg-muted">
              <TabsTrigger value="fixed" className="data-[state=active]:bg-white data-[state=active]:text-[#0C1439] data-[state=active]:font-semibold data-[state=active]:shadow">Fixed Expenses</TabsTrigger>
              <TabsTrigger value="variable" className="data-[state=active]:bg-white data-[state=active]:text-[#0C1439] data-[state=active]:font-semibold data-[state=active]:shadow">Variable Expenses</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-6">
              <ExpenseTable
                expenses={filteredExpenses}
                onEdit={(expense) => {
                  setEditingExpense(expense);
                  setIsEditDialogOpen(true);
                }}
                onDelete={(expense) => setDeletingExpense(expense)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {editingExpense && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
              <DialogDescription>Update the details of your expense.</DialogDescription>
            </DialogHeader>
            <EditExpenseForm setDialogOpen={setIsEditDialogOpen} expense={editingExpense} />
          </DialogContent>
        </Dialog>
      )}

      {deletingExpense && <DeleteExpenseDialog expense={deletingExpense} setDeletingExpense={setDeletingExpense} />}
    </div>
  );
}

function ExpenseTable({ expenses, onEdit, onDelete }: { expenses: Expense[], onEdit: (expense: Expense) => void, onDelete: (expense: Expense) => void }) {
  const { formatCurrency } = useCurrency();
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const getStatusBadgeColor = (status: string) => status === "paid" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600";

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense.id} className="hover:bg-muted/50">
            <TableCell className="font-medium">{expense.title}</TableCell>
            <TableCell>{expense.category}</TableCell>
            <TableCell>{formatDate(expense.date)}</TableCell>
            <TableCell><Badge className={`${getStatusBadgeColor(expense.status)} rounded-full px-3 py-1`}>{expense.status}</Badge></TableCell>
            <TableCell className="text-right">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{formatCurrency(expense.amount, expense.currency)}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Original: {new Intl.NumberFormat(undefined, { style: 'currency', currency: expense.currency }).format(expense.amount)}</p>
                </TooltipContent>
              </Tooltip>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(expense)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(expense)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function AddExpenseForm({ setDialogOpen }: { setDialogOpen: (open: boolean) => void }) {
  const { user } = useAuth();
  const addExpenseMutation = useAddExpense();
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { title: "", amount: undefined, currency: "USD", category: "", type: "fixed", status: "pending" },
  });

  const onSubmit = (values: ExpenseFormValues) => {
    if (!user) return;
    addExpenseMutation.mutate(
      { ...values, user_id: user.id, date: format(values.date, "yyyy-MM-dd") },
      {
        onSuccess: () => {
          toast.success("Expense added successfully!");
          setDialogOpen(false);
        },
        onError: (error) => toast.error(`Error: ${error.message}`),
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Office Rent" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem><FormLabel>Currency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="TRY">TRY (₺)</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="housing">Housing</SelectItem><SelectItem value="utilities">Utilities</SelectItem><SelectItem value="transportation">Transportation</SelectItem><SelectItem value="groceries">Groceries</SelectItem><SelectItem value="healthcare">Healthcare</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="fixed">Fixed</SelectItem><SelectItem value="variable">Variable</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
        </div>
        <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem><FormLabel>Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select><FormMessage /></FormItem>
        )} />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button type="submit" className="bg-gradient-primary" disabled={addExpenseMutation.isPending}>
            {addExpenseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Expense
          </Button>
        </div>
      </form>
    </Form>
  );
}

function EditExpenseForm({ setDialogOpen, expense }: { setDialogOpen: (open: boolean) => void, expense: Expense }) {
  const updateExpenseMutation = useUpdateExpense();
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { ...expense, date: new Date(expense.date) },
  });

  const onSubmit = (values: ExpenseFormValues) => {
    updateExpenseMutation.mutate(
      { ...values, id: expense.id, date: format(values.date, "yyyy-MM-dd") },
      {
        onSuccess: () => {
          toast.success("Expense updated successfully!");
          setDialogOpen(false);
        },
        onError: (error) => toast.error(`Error: ${error.message}`),
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Fields similar to AddExpenseForm */}
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem><FormLabel>Currency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="TRY">TRY (₺)</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="housing">Housing</SelectItem><SelectItem value="utilities">Utilities</SelectItem><SelectItem value="transportation">Transportation</SelectItem><SelectItem value="groceries">Groceries</SelectItem><SelectItem value="healthcare">Healthcare</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="fixed">Fixed</SelectItem><SelectItem value="variable">Variable</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
        </div>
        <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem><FormLabel>Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select><FormMessage /></FormItem>
        )} />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button type="submit" className="bg-gradient-primary" disabled={updateExpenseMutation.isPending}>
            {updateExpenseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}

function DeleteExpenseDialog({ expense, setDeletingExpense }: { expense: Expense, setDeletingExpense: (expense: Expense | null) => void }) {
    const deleteExpenseMutation = useDeleteExpense();
    const handleDelete = () => {
        deleteExpenseMutation.mutate(expense, {
            onSuccess: () => {
                toast.success("Expense deleted successfully!");
                setDeletingExpense(null);
            },
            onError: (error) => toast.error(`Error: ${error.message}`),
        });
    };

    return (
        <AlertDialog open={!!expense} onOpenChange={() => setDeletingExpense(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the expense.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={deleteExpenseMutation.isPending}>
                        {deleteExpenseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function ExpensePageSkeleton() {
  return (
    <div className="p-6 space-y-6 bg-gradient-dashboard min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}