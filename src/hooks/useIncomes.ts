import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Currency } from '@/contexts/CurrencyContext';
import { useLogActivity } from './useLogActivity';

// Type definitions
export interface IncomeAmountHistory {
  id: string;
  income_id: string;
  user_id: string;
  amount: number;
  note: string;
  logged_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  currency: Currency;
  category: string;
  status: 'expected' | 'received';
  date: string;
  created_at?: string;
  income_amount_history: IncomeAmountHistory[];
}

// 1. Hook to fetch all incomes for the current user
const fetchIncomes = async (userId: string) => {
  const { data, error } = await supabase
    .from('incomes')
    .select('*, income_amount_history(*)')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Income[];
};

export const useIncomes = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['incomes', user?.id],
    queryFn: () => fetchIncomes(user!.id),
    enabled: !!user,
  });
};

// 2. Hook to add a new income
const addIncome = async (newIncome: Omit<Income, 'id' | 'created_at' | 'income_amount_history'>) => {
  // First, insert the main income record
  const { data: incomeData, error: insertError } = await supabase
    .from('incomes')
    .insert([newIncome])
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);

  // If it's an expected income, create the initial history entry
  if (incomeData && incomeData.status === 'expected') {
    const { error: rpcError } = await supabase.rpc('update_income_amount', {
      in_income_id: incomeData.id,
      in_new_amount: incomeData.amount,
      in_note: 'Initial amount',
    });

    if (rpcError) {
      // If the RPC fails, we should probably roll back the income creation or handle it otherwise
      // For now, we'll just log the error
      console.error('Failed to create initial income history:', rpcError.message);
      // Depending on desired behavior, you might want to throw an error here
    }
  }

  return incomeData as Income;
};


export const useAddIncome = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: addIncome,
    onSuccess: (newIncome) => {
      queryClient.invalidateQueries({ queryKey: ['incomes', user?.id] });
      logActivity({
        type: 'income',
        action: 'create',
        description: `Created income: ${newIncome.title}`,
      });
    },
  });
};

// 3. Hook to update an existing income
interface UpdateIncomePayload {
    id: string;
    title: string;
    date: string;
    status: 'expected' | 'received';
    currency: string;
    category: string;
    amount: number;
    note?: string;
}

const updateIncome = async (payload: UpdateIncomePayload) => {
    // Update basic fields first
    const { error: updateError } = await supabase
      .from('incomes')
      .update({
        title: payload.title,
        date: payload.date,
        status: payload.status,
        currency: payload.currency,
        category: payload.category,
      })
      .eq('id', payload.id);

    if (updateError) throw new Error(updateError.message);

    // Then, update amount via RPC to maintain history, but only if status is 'expected'
    if (payload.status === 'expected') {
        const { error: rpcError } = await supabase.rpc('update_income_amount', {
            in_income_id: payload.id,
            in_new_amount: payload.amount,
            in_note: payload.note || 'Updated amount',
        });

        if (rpcError) throw new Error(rpcError.message);
    } else {
        // if status is not 'expected', just update the amount directly
        const { error: amountUpdateError } = await supabase
            .from('incomes')
            .update({ amount: payload.amount })
            .eq('id', payload.id);
        if (amountUpdateError) throw new Error(amountUpdateError.message);
    }
    return payload;
};

export const useUpdateIncome = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: updateIncome,
    onSuccess: (updatedIncome) => {
      queryClient.invalidateQueries({ queryKey: ['incomes', user?.id] });
      logActivity({
        type: 'income',
        action: 'edit',
        description: `Updated income: ${updatedIncome.title}`,
      });
    },
  });
};

// 4. Hook to delete an income
const deleteIncome = async (income: Income) => {
  const { error } = await supabase
    .from('incomes')
    .delete()
    .eq('id', income.id);

  if (error) throw new Error(error.message);
  return income;
};

export const useDeleteIncome = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: deleteIncome,
    onSuccess: (deletedIncome) => {
      queryClient.invalidateQueries({ queryKey: ['incomes', user?.id] });
      logActivity({
        type: 'income',
        action: 'delete',
        description: `Deleted income: ${deletedIncome.title}`,
      });
    },
  });
};
