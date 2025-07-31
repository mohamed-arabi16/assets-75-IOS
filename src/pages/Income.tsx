import { useState } from "react";
import { DateFilterSelector } from "@/components/DateFilterSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useFilteredData } from "@/hooks/useFilteredData";
import { useIncomes, useAddIncome, useUpdateIncome, useDeleteIncome, Income } from "@/hooks/useIncomes";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { FinancialCard } from "@/components/ui/financial-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, TrendingUp, Edit, Trash2, Filter, Calendar as CalendarIcon, Loader2, History } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IncomeHistoryModal } from "@/components/IncomeHistoryModal";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Zod schema for form validation
const incomeSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
  currency: z.string().default("USD"),
  category: z.string().min(1, { message: "Please select a category." }),
  status: z.enum(['expected', 'received']),
  date: z.date({ required_error: "A date is required." }),
  note: z.string().optional(),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

const editIncomeSchema = (originalAmount: number) => incomeSchema.refine(
  (data) => {
    if (data.status === 'expected' && data.amount !== originalAmount) {
      return data.note && data.note.length > 0;
    }
    return true;
  },
  {
    message: "A note is required when changing the amount of an expected income.",
    path: ["note"],
  }
);


// Main Component
export default function IncomePage() {
  const { data: incomesData, isLoading, isError } = useIncomes();
  const incomes = incomesData || [];
  const [filter, setFilter] = useState("all");
  const { formatCurrency, convertCurrency, currency } = useCurrency();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deletingIncome, setDeletingIncome] = useState<Income | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedIncomeForHistory, setSelectedIncomeForHistory] = useState<Income | null>(null);

  const filteredIncomesByMonth = useFilteredData(incomes);

  const filteredIncomes = filteredIncomesByMonth.filter((income) => {
    if (filter === "all") return true;
    return income.status === filter;
  });

  const totalExpected = filteredIncomesByMonth
    .filter((i) => i.status === "expected")
    .reduce((sum, i) => sum + convertCurrency(i.amount, i.currency), 0);

  const totalReceived = filteredIncomesByMonth
    .filter((i) => i.status === "received")
    .reduce((sum, i) => sum + convertCurrency(i.amount, i.currency), 0);

  const incomeByCategory = filteredIncomesByMonth.reduce((acc, income) => {
    const category = income.category;
    const convertedAmount = convertCurrency(income.amount, income.currency);
    acc[category] = (acc[category] || 0) + convertedAmount;
    return acc;
  }, {} as Record<string, number>);
  if (isLoading) {
    return <IncomePageSkeleton />;
  }
  if (isError) {
    return <div className="p-4 text-red-500">Error loading income data.</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gradient-dashboard min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Income Tracking</h1>
          <p className="text-muted-foreground">Manage your freelance income and expected payments</p>
        </div>
        <div className="flex items-center gap-4">
          <DateFilterSelector />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-financial w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Income</DialogTitle>
                <DialogDescription>Record a new income entry to track your earnings.</DialogDescription>
              </DialogHeader>
              <AddIncomeForm setDialogOpen={setIsAddDialogOpen} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <FinancialCard variant="income" title="Total Received" value={formatCurrency(totalReceived, currency)} subtitle="This month" icon={<TrendingUp className="h-5 w-5" />} />
        <FinancialCard variant="default" title="Expected" value={formatCurrency(totalExpected, currency)} subtitle="Next 30-60 days" icon={<TrendingUp className="h-5 w-5" />} />
        <FinancialCard variant="default" title="Total Income" value={formatCurrency(totalReceived + totalExpected, currency)} subtitle="Combined total" icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      {/* Income by Category */}
      <div className="bg-gradient-card rounded-lg border border-border shadow-card">
        <div className="p-4 sm:p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Total Income by Category</h2>
          <p className="text-muted-foreground">Breakdown of income sources</p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(incomeByCategory).map(([category, amount]) => (
              <div key={category} className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-income" />
                  <span className="text-sm font-medium capitalize">{category}</span>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(amount, currency)}</div>
                <div className="text-sm text-muted-foreground">
                  {((amount / (totalReceived + totalExpected)) * 100).toFixed(1)}% of total
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Income List */}
      <div className="bg-gradient-card rounded-lg border border-border shadow-card">
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Income History</h2>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="expected">Expected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <IncomeList
          incomes={filteredIncomes}
          onEdit={(income) => {
            setEditingIncome(income);
            setIsEditDialogOpen(true);
          }}
          onDelete={(income) => setDeletingIncome(income)}
          onViewHistory={(income) => {
            setSelectedIncomeForHistory(income);
            setIsHistoryModalOpen(true);
          }}
        />
      </div>

      {editingIncome && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Income</DialogTitle>
              <DialogDescription>Update the details of your income.</DialogDescription>
            </DialogHeader>
            <EditIncomeForm setDialogOpen={setIsEditDialogOpen} income={editingIncome} />
          </DialogContent>
        </Dialog>
      )}

      {deletingIncome && <DeleteIncomeDialog income={deletingIncome} setDeletingIncome={setDeletingIncome} />}

      <IncomeHistoryModal
        income={selectedIncomeForHistory}
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
}

// Sub-components
function IncomeList({ incomes, onEdit, onDelete, onViewHistory }: { incomes: Income[], onEdit: (income: Income) => void, onDelete: (income: Income) => void, onViewHistory: (income: Income) => void }) {
  const { formatCurrency } = useCurrency();
  const getStatusColor = (status: string) => (status === "received" ? "bg-income" : "bg-orange-500");
  const getCategoryIcon = (_category: string) => <TrendingUp className="h-4 w-4" />;

  return (
    <div className="divide-y divide-border">
      {incomes.map((income) => (
        <div key={income.id} className="p-4 sm:p-6 hover:bg-muted/50 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-income/10 rounded-lg flex-shrink-0">
                {getCategoryIcon(income.category)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base">{income.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {new Date(income.date).toLocaleDateString()} • {income.category}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="text-left sm:text-right">
                <div className="font-semibold text-sm sm:text-base">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>{formatCurrency(income.amount, income.currency)}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Original: {new Intl.NumberFormat(undefined, { style: 'currency', currency: income.currency }).format(income.amount)}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Badge className={`${getStatusColor(income.status)} text-white text-xs`}>{income.status}</Badge>
              </div>
              <div className="flex gap-1 sm:gap-2">
                 {income.status === 'expected' && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onViewHistory(income)}>
                    <History className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(income)}><Edit className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onDelete(income)}><Trash2 className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
export function AddIncomeForm({ setDialogOpen }: { setDialogOpen: (open: boolean) => void }) {
  const { user } = useAuth();
  const addIncomeMutation = useAddIncome();
  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { title: "", amount: undefined, currency: "USD", category: "", status: "expected" },
  });

  const onSubmit = (values: IncomeFormValues) => {
    if (!user) return;
    addIncomeMutation.mutate(
      { ...values, user_id: user.id, date: format(values.date, "yyyy-MM-dd") },
      {
        onSuccess: () => {
          toast.success("Income added successfully!");
          setDialogOpen(false);
        },
        onError: (error) => {
          toast.error(`Error adding income: ${error.message}`);
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Freelance Project" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem><FormLabel>Currency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl><SelectContent><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="TRY">TRY (₺)</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
        </div>
        <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl><SelectContent><SelectItem value="freelance">Freelance</SelectItem><SelectItem value="commission">Commission</SelectItem><SelectItem value="rent">Rent</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="expected">Expected</SelectItem><SelectItem value="received">Received</SelectItem></SelectContent></Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem><FormLabel>Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
        )} />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button type="submit" className="bg-gradient-primary" disabled={addIncomeMutation.isPending}>
            {addIncomeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Income
          </Button>
        </div>
      </form>
    </Form>
  );
}

function EditIncomeForm({ setDialogOpen, income }: { setDialogOpen: (open: boolean) => void, income: Income }) {
  const updateIncomeMutation = useUpdateIncome();
  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(editIncomeSchema(income.amount)),
    defaultValues: {
      ...income,
      date: new Date(income.date),
      note: '',
    },
  });

  const onSubmit = (values: IncomeFormValues) => {
    updateIncomeMutation.mutate(
      { ...values, id: income.id, date: format(values.date, "yyyy-MM-dd") },
      {
        onSuccess: () => {
          toast.success("Income updated successfully!");
          setDialogOpen(false);
        },
        onError: (error) => {
          toast.error(`Error updating income: ${error.message}`);
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Form fields are identical to AddIncomeForm, just pre-filled */}
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
         <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem><FormLabel>Currency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl><SelectContent><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="TRY">TRY (₺)</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
        </div>
        <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl><SelectContent><SelectItem value="freelance">Freelance</SelectItem><SelectItem value="commission">Commission</SelectItem><SelectItem value="rent">Rent</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="expected">Expected</SelectItem><SelectItem value="received">Received</SelectItem></SelectContent></Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem><FormLabel>Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="note" render={({ field }) => (
            <FormItem><FormLabel>Update Note (Required if amount changes)</FormLabel><FormControl><Input placeholder="e.g., Partial payment received" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button type="submit" className="bg-gradient-primary" disabled={updateIncomeMutation.isPending}>
             {updateIncomeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}

function DeleteIncomeDialog({ income, setDeletingIncome }: { income: Income, setDeletingIncome: (income: Income | null) => void }) {
    const deleteIncomeMutation = useDeleteIncome();
    const handleDelete = () => {
        deleteIncomeMutation.mutate(income, {
            onSuccess: () => {
                toast.success("Income deleted successfully!");
                setDeletingIncome(null);
            },
            onError: (error) => {
                toast.error(`Error deleting income: ${error.message}`);
            },
        });
    };

    return (
        <AlertDialog open={!!income} onOpenChange={() => setDeletingIncome(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the income.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={deleteIncomeMutation.isPending}>
                        {deleteIncomeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function IncomePageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gradient-dashboard min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-96" />
    </div>
  );
}