import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLogActivity } from './useLogActivity';

// Type definition
export interface Asset {
  id: string;
  user_id: string;
  type: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  currency: string;
  auto_update: boolean;
  created_at?: string;
}

// 1. Hook to fetch all assets
const fetchAssets = async (userId: string) => {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Asset[];
};

export const useAssets = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['assets', user?.id],
    queryFn: () => fetchAssets(user!.id),
    enabled: !!user,
  });
};

// Hook to fetch a single asset by ID
const fetchAssetById = async (assetId: string, userId: string) => {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Asset not found');
    }
    throw new Error(error.message);
  }
  return data as Asset;
};

export const useAsset = (assetId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => fetchAssetById(assetId, user!.id),
    enabled: !!user && !!assetId,
  });
};

// 2. Hook to add a new asset
type NewAsset = Omit<Asset, 'id' | 'created_at'>;

const addAsset = async (newAsset: NewAsset) => {
  const { data, error } = await supabase
    .from('assets')
    .insert([newAsset])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Asset;
};

export const useAddAsset = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: addAsset,
    onSuccess: (newAsset) => {
      queryClient.invalidateQueries({ queryKey: ['assets', user?.id] });
      logActivity({
        type: 'asset',
        action: 'create',
        description: `Created new asset: ${newAsset.type} (${newAsset.quantity} ${newAsset.unit})`,
      });
    },
  });
};

// 3. Hook to update an existing asset
const updateAsset = async (updatedAsset: Partial<Asset> & { id: string }) => {
  const { data, error } = await supabase
    .from('assets')
    .update(updatedAsset)
    .eq('id', updatedAsset.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Asset;
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: updateAsset,
    onSuccess: (updatedAsset) => {
      queryClient.invalidateQueries({ queryKey: ['assets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['asset', updatedAsset.id] });
      logActivity({
        type: 'asset',
        action: 'edit',
        description: `Updated asset: ${updatedAsset.type}`,
      });
    },
  });
};

// 4. Hook to delete an asset
const deleteAsset = async (asset: Asset) => {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', asset.id);

  if (error) throw new Error(error.message);
  return asset;
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: (deletedAsset) => {
      queryClient.invalidateQueries({ queryKey: ['assets', user?.id] });
      logActivity({
        type: 'asset',
        action: 'delete',
        description: `Deleted asset: ${deletedAsset.type}`,
      });
    },
  });
};
