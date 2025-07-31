import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Currency } from '@/contexts/CurrencyContext';
import { useLogActivity } from './useLogActivity';

// Define the Expense type
export interface Expense {
  id: string;
  user_id: string;
  title: string;
  category: string;
  amount: number;
  currency: Currency;
  date: string;
  status: 'paid' | 'pending';
  type: 'fixed' | 'variable';
  created_at?: string;
}

// 1. Hook to fetch all expenses for the current user
const fetchExpenses = async (userId: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Expense[];
};

export const useExpenses = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: () => fetchExpenses(user!.id),
    enabled: !!user,
  });
};

// 2. Hook to add a new expense
const addExpense = async (newExpense: Omit<Expense, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([newExpense])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Expense;
};

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: addExpense,
    onSuccess: (newExpense) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.id] });
      logActivity({
        type: 'expense',
        action: 'create',
        description: `Created expense: ${newExpense.title}`,
      });
    },
  });
};

// 3. Hook to update an existing expense
const updateExpense = async (updatedExpense: Partial<Expense> & { id: string }) => {
  const { data, error } = await supabase
    .from('expenses')
    .update(updatedExpense)
    .eq('id', updatedExpense.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Expense;
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: updateExpense,
    onSuccess: (updatedExpense) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.id] });
      logActivity({
        type: 'expense',
        action: 'edit',
        description: `Updated expense: ${updatedExpense.title}`,
      });
    },
  });
};

// 4. Hook to delete an expense
const deleteExpense = async (expense: Expense) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expense.id);

  if (error) throw new Error(error.message);
  return expense;
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: (deletedExpense) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.id] });
      logActivity({
        type: 'expense',
        action: 'delete',
        description: `Deleted expense: ${deletedExpense.title}`,
      });
    },
  });
};
