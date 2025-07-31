import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export interface Activity {
  id: string;
  user_id: string;
  type: string;
  action: string;
  description: string;
  timestamp: string;
}

const fetchRecentActivity = async (userId: string, limit: number = 5) => {
  const { data, error } = await supabase
    .from('recent_activity')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent activity:", error);
    throw new Error(error.message);
  }
  return data as Activity[];
};

export const useRecentActivity = (limit: number = 10) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recentActivity', user?.id, limit],
    queryFn: () => fetchRecentActivity(user!.id, limit),
    enabled: !!user,
  });
};
