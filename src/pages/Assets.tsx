import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAssetPrices } from "@/hooks/useAssetPrices";
import { useAssets, useAddAsset, useUpdateAsset, useDeleteAsset, Asset } from "@/hooks/useAssets";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { FinancialCard } from "@/components/ui/financial-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Gem,
  Bitcoin,
  Home,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Loader2,
} from "lucide-react";

const assetSchema = z.object({
  type: z.string().min(1, { message: "Please select an asset type." }),
  quantity: z.coerce.number().positive({ message: "Quantity must be positive." }),
  unit: z.string().min(1, { message: "Please select a unit." }),
  price_per_unit: z.coerce.number().positive({ message: "Price must be positive." }),
  currency: z.string().default("USD"),
  auto_update: z.boolean().default(false),
});

type AssetFormValues = z.infer<typeof assetSchema>;

export default function AssetsPage() {
  const { data: assetsData, isLoading, isError } = useAssets();
  const assets = assetsData || [];
  const { prices: assetPrices, loading: pricesLoading } = useAssetPrices();
  const { formatCurrency } = useCurrency();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);

  const updatedAssets = assets.map((asset) => {
    if (asset.auto_update && !pricesLoading && assetPrices) {
      const lowerCaseType = asset.type.toLowerCase();
      if (lowerCaseType in assetPrices) {
        const newPrice = assetPrices[lowerCaseType as keyof typeof assetPrices];
        if (typeof newPrice === 'number') {
          return { ...asset, price_per_unit: newPrice };
        }
      }
    }
    return asset;
  });

  const totalAssetValue = updatedAssets.reduce((sum, asset) => sum + asset.quantity * asset.price_per_unit, 0);
  const silverValue = updatedAssets.filter(a => a.type === "silver").reduce((sum, a) => sum + a.quantity * a.price_per_unit, 0);
  const cryptoValue = updatedAssets.filter(a => a.type === "bitcoin" || a.type === "ethereum" || a.type === "cardano").reduce((sum, a) => sum + a.quantity * a.price_per_unit, 0);
  const realEstateValue = updatedAssets.filter(a => a.type === "real_estate").reduce((sum, a) => sum + a.quantity * a.price_per_unit, 0);

  if (isLoading) return <AssetsPageSkeleton />;
  if (isError) return <div className="p-4 text-red-500">Error loading assets.</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gradient-dashboard min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Asset Tracking</h1>
          <p className="text-muted-foreground">Monitor your non-cash assets like silver, crypto, and real estate</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}><DialogTrigger asChild><Button className="bg-gradient-primary shadow-financial w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />Add Asset</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add New Asset</DialogTitle><DialogDescription>Track a new asset in your portfolio.</DialogDescription></DialogHeader><AddAssetForm setDialogOpen={setIsAddDialogOpen} /></DialogContent></Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinancialCard variant="asset" title="Total Assets" value={formatCurrency(totalAssetValue, "USD")} subtitle="All tracked assets" icon={<Gem className="h-5 w-5" />} />
        <FinancialCard variant="default" title="Silver Value" value={formatCurrency(silverValue, "USD")} subtitle="Precious metals" icon={<Gem className="h-5 w-5" />} />
        <FinancialCard variant="default" title="Crypto Value" value={formatCurrency(cryptoValue, "USD")} subtitle="Digital assets" icon={<Bitcoin className="h-5 w-5" />} />
        <FinancialCard variant="default" title="Real Estate" value={formatCurrency(realEstateValue, "USD")} subtitle="Property value" icon={<Home className="h-5 w-5" />} />
      </div>

      <div className="bg-gradient-card rounded-lg border border-border shadow-card">
        <div className="p-4 sm:p-6 border-b border-border"><h2 className="text-xl font-semibold">Asset Portfolio</h2><p className="text-muted-foreground">Your tracked assets and their current values</p></div>
        <div className="p-4 sm:p-6"><div className="grid gap-4">
          {updatedAssets.map((asset) => (<AssetCard key={asset.id} asset={asset} onDelete={() => setDeletingAsset(asset)} />))}
        </div></div>
      </div>

      {deletingAsset && <DeleteAssetDialog asset={deletingAsset} setDeletingAsset={setDeletingAsset} />}
    </div>
  );
}

function AssetCard({ asset, onDelete }: { asset: Asset; onDelete: () => void; }) {
    const navigate = useNavigate();
    const { formatCurrency } = useCurrency();
    const formatAssetType = (type: string) => type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const getAssetIcon = (type: string) => {
        switch (type) {
            case "silver": case "gold": return <Gem className="h-5 w-5" />;
            case "bitcoin": case "ethereum": case "cardano": return <Bitcoin className="h-5 w-5" />;
            case "real_estate": return <Home className="h-5 w-5" />;
            default: return <Gem className="h-5 w-5" />;
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-asset/10 rounded-lg">{getAssetIcon(asset.type)}</div>
                        <div>
                            <CardTitle className="text-lg">{formatAssetType(asset.type)}</CardTitle>
                            <CardDescription>{asset.quantity} {asset.unit} @ {formatCurrency(asset.price_per_unit, asset.currency as 'USD' | 'TRY')}/{asset.unit}</CardDescription>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{formatCurrency(asset.quantity * asset.price_per_unit, asset.currency as 'USD' | 'TRY')}</div>
                        {asset.auto_update && <div className="flex items-center justify-end gap-1 text-xs text-green-600"><TrendingUp className="h-3 w-3" />Auto-updated</div>}
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/assets/${asset.id}/edit`)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}

function AddAssetForm({ setDialogOpen }: { setDialogOpen: (open: boolean) => void }) {
  const { user } = useAuth();
  const addAssetMutation = useAddAsset();
  const { prices: assetPrices, loading: pricesLoading } = useAssetPrices();
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: { type: "", quantity: undefined, unit: "", price_per_unit: undefined, currency: "USD", auto_update: false },
  });

  const assetType = form.watch("type");
  const isPriceAuto = !pricesLoading && assetType && (assetType in assetPrices);

  useEffect(() => {
    if (pricesLoading || !assetType || !assetPrices) return;

    let price: number | undefined;
    let unit: string | undefined;
    let autoUpdate = false;

    const lowerCaseType = assetType.toLowerCase();

    if (lowerCaseType in assetPrices) {
        price = assetPrices[lowerCaseType as keyof typeof assetPrices];
        autoUpdate = true;
        if (lowerCaseType === 'gold' || lowerCaseType === 'silver') {
            unit = 'ounces';
        } else if (lowerCaseType === 'bitcoin') {
            unit = 'BTC';
        } else if (lowerCaseType === 'ethereum') {
            unit = 'ETH';
        } else if (lowerCaseType === 'cardano') {
            unit = 'ADA';
        }
    }

    if (price !== undefined) {
      form.setValue('price_per_unit', price, { shouldValidate: true });
      form.setValue('auto_update', autoUpdate);
    }
    if (unit) {
      form.setValue('unit', unit, { shouldValidate: true });
    }
  }, [assetType, assetPrices, pricesLoading, form]);


  const onSubmit = (values: AssetFormValues) => {
    if (!user) return;
    addAssetMutation.mutate({ ...values, user_id: user.id }, {
        onSuccess: () => { toast.success("Asset added!"); setDialogOpen(false); },
        onError: (err) => toast.error(`Error: ${err.message}`),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Asset Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select asset type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="gold">Gold</SelectItem><SelectItem value="silver">Silver</SelectItem><SelectItem value="bitcoin">Bitcoin</SelectItem><SelectItem value="ethereum">Ethereum</SelectItem><SelectItem value="cardano">Cardano</SelectItem><SelectItem value="real_estate">Real Estate</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="quantity" render={({ field }) => (<FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" step="0.001" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel>Unit</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger></FormControl><SelectContent><SelectItem value="ounces">Ounces</SelectItem><SelectItem value="grams">Grams</SelectItem><SelectItem value="BTC">BTC</SelectItem><SelectItem value="ETH">ETH</SelectItem><SelectItem value="ADA">ADA</SelectItem><SelectItem value="property">Property</SelectItem><SelectItem value="shares">Shares</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>
        {!isPriceAuto && (
            <FormField
              control={form.control}
              name="price_per_unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Unit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={"0.00"}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        )}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={addAssetMutation.isPending}>{addAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Asset</Button></div>
      </form>
    </Form>
  );
}

function DeleteAssetDialog({ asset, setDeletingAsset }: { asset: Asset, setDeletingAsset: (asset: Asset | null) => void }) {
    const deleteAssetMutation = useDeleteAsset();
    return (
        <AlertDialog open={!!asset} onOpenChange={() => setDeletingAsset(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete this asset.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteAssetMutation.mutate(asset, { onSuccess: () => { toast.success("Asset deleted!"); setDeletingAsset(null); }, onError: (err) => toast.error(`Error: ${err.message}`) })} disabled={deleteAssetMutation.isPending}>
                        {deleteAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function AssetsPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gradient-dashboard min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-80" /></div><Skeleton className="h-10 w-32" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
        <Skeleton className="h-96" />
    </div>
  );
}