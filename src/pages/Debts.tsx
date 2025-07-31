import { useState, useEffect } from "react";
import { DateFilterSelector } from "@/components/DateFilterSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useFilteredData } from "@/hooks/useFilteredData";
import { useDebts, useAddDebt, useUpdateDebt, useDeleteDebt, Debt } from "@/hooks/useDebts";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DebtHistoryModal } from "@/components/DebtHistoryModal";
import {
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  Plus,
  Loader2,
  DollarSign,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, isAfter, subYears } from "date-fns";

// Zod schema for form validation
const debtSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  creditor: z.string().min(2, { message: "Creditor must be at least 2 characters." }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number." }),
  currency: z.string().default("USD"),
  status: z.enum(['pending', 'paid']),
  due_date: z.date({ required_error: "A due date is required." }),
  note: z.string().optional(),
}).refine(data => {
    const debtType = isAfter(data.due_date, subYears(new Date(), 1)) ? 'long' : 'short';
    return { ...data, type: debtType };
});

type DebtFormValues = z.infer<typeof debtSchema>;

const editDebtSchema = (originalAmount: number) => debtSchema.refine(
  (data) => {
    if (data.amount !== originalAmount) {
      return data.note && data.note.length > 0;
    }
    return true;
  },
  {
    message: "A note is required when changing the debt amount.",
    path: ["note"],
  }
);

export default function DebtsPage() {
  const { data: debtsData, isLoading, isError } = useDebts();
  const debts = debtsData || [];
  const [activeTab, setActiveTab] = useState("short");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedDebtForHistory, setSelectedDebtForHistory] = useState<Debt | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const { formatCurrency, convertCurrency, currency } = useCurrency();

  const filteredDebtsByMonth = useFilteredData(debts, 'due_date');

  const shortTermDebts = filteredDebtsByMonth.filter((debt) => debt.type === "short");
  const longTermDebts = filteredDebtsByMonth.filter((debt) => debt.type === "long");

  const totalShortTerm = shortTermDebts.reduce((sum, debt) => sum + convertCurrency(debt.amount, debt.currency), 0);
  const totalLongTerm = longTermDebts.reduce((sum, debt) => sum + convertCurrency(debt.amount, debt.currency), 0);
  const totalPending = filteredDebtsByMonth.filter((d) => d.status === "pending").reduce((sum, d) => sum + convertCurrency(d.amount, d.currency), 0);
  const totalPaid = filteredDebtsByMonth.filter((d) => d.status === "paid").reduce((sum, d) => sum + convertCurrency(d.amount, d.currency), 0);

  const filteredDebts = activeTab === "short" ? shortTermDebts : longTermDebts;

  if (isLoading) {
    return <DebtsPageSkeleton />;
  }

  if (isError) {
    return <div className="p-6 text-red-500">Error loading debts.</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-dashboard min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Debt Management</h1>
          <p className="text-muted-foreground">Track and manage your short-term and long-term debts</p>
        </div>
        <div className="flex items-center gap-4">
          <DateFilterSelector />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">Add Debt</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Debt</DialogTitle>
                <DialogDescription>Record a new debt to track your liabilities.</DialogDescription>
              </DialogHeader>
              <AddDebtForm setDialogOpen={setIsAddDialogOpen} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinancialCard variant="debt" title="Short-Term Debt" value={formatCurrency(totalShortTerm, currency)} subtitle="Due within 1 year" icon={<CreditCard className="h-5 w-5" />} />
        <FinancialCard variant="asset" title="Long-Term Debt" value={formatCurrency(totalLongTerm, currency)} subtitle="Due in over a year" icon={<AlertTriangle className="h-5 w-5" />} />
        <FinancialCard variant="expense" title="Total Pending" value={formatCurrency(totalPending, currency)} subtitle="Awaiting payment" icon={<Clock className="h-5 w-5" />} />
        <FinancialCard variant="income" title="Total Paid" value={formatCurrency(totalPaid, currency)} subtitle="Completed payments" icon={<CheckCircle className="h-5 w-5" />} />
      </div>

      <div className="bg-gradient-card rounded-xl border border-border shadow-card">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Debt Overview</h2>
          <p className="text-muted-foreground">View and manage all your debts</p>
        </div>
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-fit grid-cols-2 bg-[#E9F4F4] dark:bg-muted">
              <TabsTrigger value="short" className="data-[state=active]:bg-white data-[state=active]:text-[#0C1439] data-[state=active]:font-semibold data-[state=active]:shadow">Short-Term Debt</TabsTrigger>
              <TabsTrigger value="long" className="data-[state=active]:bg-white data-[state=active]:text-[#0C1439] data-[state=active]:font-semibold data-[state=active]:shadow">Long-Term Debt</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-6">
              <DebtTable
                debts={filteredDebts}
                onEdit={(debt) => {
                  setEditingDebt(debt);
                  setIsEditDialogOpen(true);
                }}
                onDelete={(debt) => setDeletingDebt(debt)}
                onViewHistory={(debt) => {
                  setSelectedDebtForHistory(debt);
                  setIsHistoryModalOpen(true);
                }}
                onMakePayment={(debt) => {
                  setPayingDebt(debt);
                  setIsPaymentDialogOpen(true);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {editingDebt && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Debt</DialogTitle>
              <DialogDescription>Update the details of your debt.</DialogDescription>
            </DialogHeader>
            <EditDebtForm setDialogOpen={setIsEditDialogOpen} debt={editingDebt} />
          </DialogContent>
        </Dialog>
      )}

      {deletingDebt && <DeleteDebtDialog debt={deletingDebt} setDeletingDebt={setDeletingDebt} />}

      {payingDebt && (
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make a Payment on {payingDebt.title}</DialogTitle>
              <DialogDescription>
                Current balance: {formatCurrency(payingDebt.amount, payingDebt.currency)}
              </DialogDescription>
            </DialogHeader>
            <MakePaymentForm setDialogOpen={setIsPaymentDialogOpen} debt={payingDebt} />
          </DialogContent>
        </Dialog>
      )}

      <DebtHistoryModal
        debt={selectedDebtForHistory}
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
}

function DebtTable({ debts, onEdit, onDelete, onViewHistory, onMakePayment }: { debts: Debt[], onEdit: (debt: Debt) => void, onDelete: (debt: Debt) => void, onViewHistory: (debt: Debt) => void, onMakePayment: (debt: Debt) => void }) {
  const { formatCurrency } = useCurrency();
  const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A";

  return (
    <Table>
      <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Creditor</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
      <TableBody>
        {debts.map((debt) => (
          <TableRow key={debt.id}>
            <TableCell className="font-medium">{debt.title}</TableCell>
            <TableCell>{debt.creditor}</TableCell>
            <TableCell>{formatDate(debt.due_date)}</TableCell>
            <TableCell><Badge variant={debt.status === 'paid' ? 'default' : 'destructive'}>{debt.status}</Badge></TableCell>
            <TableCell className="text-right">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{formatCurrency(debt.amount, debt.currency)}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Original: {new Intl.NumberFormat(undefined, { style: 'currency', currency: debt.currency }).format(debt.amount)}</p>
                </TooltipContent>
              </Tooltip>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => onMakePayment(debt)} disabled={debt.status === 'paid'}>
                      <DollarSign className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Make Payment</p></TooltipContent>
                </Tooltip>
                 <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => onViewHistory(debt)}>
                      <Clock className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>View History</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(debt)}><Edit className="h-4 w-4" /></Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Edit</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(debt)}><Trash2 className="h-4 w-4" /></Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Delete</p></TooltipContent>
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function AddDebtForm({ setDialogOpen }: { setDialogOpen: (open: boolean) => void }) {
  const { user } = useAuth();
  const addDebtMutation = useAddDebt();
  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: { title: "", creditor: "", amount: undefined, currency: "USD", status: "pending" },
  });

  const onSubmit = (values: DebtFormValues) => {
    if (!user) return;
    const debtType = isAfter(values.due_date, subYears(new Date(), -1)) ? 'long' : 'short';
    addDebtMutation.mutate(
      { ...values, user_id: user.id, type: debtType, due_date: format(values.due_date, "yyyy-MM-dd") },
      {
        onSuccess: () => { toast.success("Debt added!"); setDialogOpen(false); },
        onError: (err) => toast.error(`Error: ${err.message}`),
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Car Loan" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="creditor" render={({ field }) => (<FormItem><FormLabel>Creditor</FormLabel><FormControl><Input placeholder="e.g., Bank of America" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Currency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="TRY">TRY</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>
        <FormField control={form.control} name="due_date" render={({ field }) => (<FormItem><FormLabel>Due Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={addDebtMutation.isPending}>{addDebtMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Debt</Button></div>
      </form>
    </Form>
  );
}

function EditDebtForm({ setDialogOpen, debt }: { setDialogOpen: (open: boolean) => void, debt: Debt }) {
  const updateDebtMutation = useUpdateDebt();
  const form = useForm<DebtFormValues>({
    resolver: zodResolver(editDebtSchema(debt.amount)),
    defaultValues: { ...debt, due_date: new Date(debt.due_date!), note: '' },
  });

  const onSubmit = (values: DebtFormValues) => {
    updateDebtMutation.mutate(
      { ...values, id: debt.id, due_date: format(values.due_date, "yyyy-MM-dd") },
      {
        onSuccess: () => { toast.success("Debt updated!"); setDialogOpen(false); },
        onError: (err) => {
          // If the error is a Zod validation error, it will be handled by the form.
          // Otherwise, show a toast.
          if (!('fieldErrors' in err)) {
            toast.error(`Error: ${err.message}`);
          }
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="creditor" render={({ field }) => (<FormItem><FormLabel>Creditor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Currency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="TRY">TRY</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>
        <FormField control={form.control} name="due_date" render={({ field }) => (<FormItem><FormLabel>Due Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="note" render={({ field }) => (<FormItem><FormLabel>Update Note (Required if amount changes)</FormLabel><FormControl><Input placeholder="e.g., Made a large payment" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={updateDebtMutation.isPending}>{updateDebtMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes</Button></div>
      </form>
    </Form>
  );
}

const paymentSchema = z.object({
  paymentAmount: z.coerce.number().positive({ message: "Payment amount must be positive." }),
  note: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

function MakePaymentForm({ setDialogOpen, debt }: { setDialogOpen: (open: boolean) => void, debt: Debt }) {
  const updateDebtMutation = useUpdateDebt();
  const { formatCurrency } = useCurrency();
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentAmount: undefined,
      note: "",
    },
  });

  const onSubmit = (values: PaymentFormValues) => {
    const newAmount = debt.amount - values.paymentAmount;
    if (newAmount < 0) {
      form.setError("paymentAmount", {
        type: "manual",
        message: "Payment cannot exceed the remaining debt amount.",
      });
      return;
    }

    const note = values.note || `Payment of ${formatCurrency(values.paymentAmount, debt.currency)}`;

    updateDebtMutation.mutate(
      {
        id: debt.id,
        // Pass all required fields for the mutation, even if not changed here
        title: debt.title,
        creditor: debt.creditor,
        due_date: debt.due_date,
        status: newAmount === 0 ? 'paid' : 'pending',
        currency: debt.currency,
        // The crucial part: update the amount
        amount: newAmount,
        note: note,
      },
      {
        onSuccess: () => {
          toast.success("Payment recorded successfully!");
          setDialogOpen(false);
        },
        onError: (err) => {
          toast.error(`Error: ${err.message}`);
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="paymentAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Monthly payment" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateDebtMutation.isPending}>
            {updateDebtMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
        </div>
      </form>
    </Form>
  );
}

function DeleteDebtDialog({ debt, setDeletingDebt }: { debt: Debt, setDeletingDebt: (debt: Debt | null) => void }) {
    const deleteDebtMutation = useDeleteDebt();
    return (
        <AlertDialog open={!!debt} onOpenChange={() => setDeletingDebt(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the debt record.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteDebtMutation.mutate(debt, { onSuccess: () => { toast.success("Debt deleted!"); setDeletingDebt(null); }, onError: (err) => toast.error(`Error: ${err.message}`) })} disabled={deleteDebtMutation.isPending}>
                        {deleteDebtMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function DebtsPageSkeleton() {
  return (
    <div className="p-6 space-y-6 bg-gradient-dashboard min-h-screen">
      <div className="flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-9 w-72" /><Skeleton className="h-5 w-96" /></div><Skeleton className="h-10 w-32" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      <Skeleton className="h-96" />
    </div>
  );
}