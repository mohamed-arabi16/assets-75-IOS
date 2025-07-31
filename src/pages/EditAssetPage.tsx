import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAsset, useUpdateAsset, Asset } from "@/hooks/useAssets";
import { useAssetPrices } from "@/hooks/useAssetPrices";
import { useCurrency } from "@/contexts/CurrencyContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Currency } from "@/contexts/CurrencyContext";

const assetSchema = z.object({
  type: z.string().min(1, { message: "Please select an asset type." }),
  quantity: z.coerce.number().positive({ message: "Quantity must be positive." }),
  unit: z.string().min(1, { message: "Please select a unit." }),
  price_per_unit: z.coerce.number().positive({ message: "Price must be positive." }),
  currency: z.string().default("USD"),
  auto_update: z.boolean().default(false),
});

type AssetFormValues = z.infer<typeof assetSchema>;

const EditAssetForm = ({ asset }: { asset: Asset }) => {
  const navigate = useNavigate();
  const updateAssetMutation = useUpdateAsset();
  const { prices: assetPrices, loading: pricesLoading } = useAssetPrices();

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      ...asset,
      currency: asset.currency as 'USD' | 'TRY',
    },
  });

  const assetType = form.watch("type");
  const autoUpdateEnabled = form.watch("auto_update");

  useEffect(() => {
    if (pricesLoading || !assetType || !autoUpdateEnabled || !assetPrices) return;

    const lowerCaseType = assetType.toLowerCase();
    if (lowerCaseType in assetPrices) {
      const price = assetPrices[lowerCaseType as keyof typeof assetPrices];
      if (price) {
        form.setValue('price_per_unit', price, { shouldValidate: true });
      }
    }
  }, [assetType, autoUpdateEnabled, assetPrices, pricesLoading, form]);

  const onSubmit = (values: AssetFormValues) => {
    updateAssetMutation.mutate(
      { ...values, id: asset.id },
      {
        onSuccess: () => {
          toast.success("Asset updated successfully!");
          navigate("/assets");
        },
        onError: (err) => toast.error(`Error: ${err.message}`),
      }
    );
  };

  const isPriceAuto = autoUpdateEnabled && !pricesLoading && assetType && (assetType in assetPrices);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Asset Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="gold">Gold</SelectItem><SelectItem value="silver">Silver</SelectItem><SelectItem value="bitcoin">Bitcoin</SelectItem><SelectItem value="ethereum">Ethereum</SelectItem><SelectItem value="cardano">Cardano</SelectItem><SelectItem value="real_estate">Real Estate</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="quantity" render={({ field }) => (<FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel>Unit</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="ounces">Ounces</SelectItem><SelectItem value="grams">Grams</SelectItem><SelectItem value="BTC">BTC</SelectItem><SelectItem value="ETH">ETH</SelectItem><SelectItem value="ADA">ADA</SelectItem><SelectItem value="property">Property</SelectItem><SelectItem value="shares">Shares</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
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
                      {...field}
                      disabled={isPriceAuto}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Currency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="TRY">TRY</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>
        <FormField control={form.control} name="auto_update" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Auto Update Price</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => navigate("/assets")}>Cancel</Button><Button type="submit" disabled={updateAssetMutation.isPending}>{updateAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes</Button></div>
      </form>
    </Form>
  );
};

export default function EditAssetPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const { data: asset, isLoading, isError, error } = useAsset(assetId ?? "");

  if (!assetId) {
    return <div className="p-6">Error: Asset ID is missing.</div>;
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <div className="flex justify-end gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="p-6 text-red-500 text-center">{error.message}</div>;
  }

  return (
    <div className="p-4 sm:p-6 bg-gradient-dashboard min-h-screen">
        <div className="max-w-2xl mx-auto">
            <div className="space-y-2 mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Edit Asset</h1>
                <p className="text-muted-foreground">Update the details for your asset: {asset.type}</p>
            </div>
            <div className="bg-gradient-card rounded-lg border border-border shadow-card p-6">
                <EditAssetForm asset={asset} />
            </div>
        </div>
    </div>
  );
}
