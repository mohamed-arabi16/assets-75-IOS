import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

type ActivityLog = {
  user_id: string;
  type: string;
  action: string;
  description: string;
};

const logActivity = async (activity: ActivityLog) => {
  const { error } = await supabase.from('recent_activity').insert([activity]);
  if (error) {
    console.error("Failed to log activity:", error);
    throw new Error(error.message);
  }
};

export const useLogActivity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: logActivity,
    onSuccess: () => {
      // Invalidate recent activity query to refetch the list on the dashboard
      queryClient.invalidateQueries({ queryKey: ['recentActivity', user?.id] });
    },
    onError: (error) => {
        // We don't want to show a toast for this, as it's a background task.
        // Logging to console is sufficient.
        console.error("Error in useLogActivity:", error.message);
    }
  });

  return (activity: Omit<ActivityLog, 'user_id'>) => {
    if (!user) return;
    mutation.mutate({ ...activity, user_id: user.id });
  };
};
