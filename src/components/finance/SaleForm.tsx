"use client";

import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Sale } from "@/types";
import { format } from "date-fns";

interface SaleFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function SaleForm({ onClose, onSuccess }: SaleFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Partial<Sale>>({
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      type: "milk",
      quantity: "",
      unit: "liter",
      price: "",
      buyer: "",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<Sale>) => {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save sale");
      }

      return res.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = (data: Partial<Sale>) => {
    mutation.mutate(data);
  };

  const type = watch("type");
  const quantity = watch("quantity");
  const price = watch("price");
  const total = quantity && price ? parseFloat(quantity) * parseFloat(price) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Sale</CardTitle>
        <CardDescription>Record a farm sale</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input id="date" type="date" {...register("date", { required: true })} />
          </div>

          <div>
            <Label htmlFor="type">Type *</Label>
            <Select
              value={watch("type") || "milk"}
              onValueChange={(value) => {
                setValue("type", value as Sale["type"]);
                // Auto-set unit based on type
                if (value === "milk") setValue("unit", "liter");
                else if (value === "egg") setValue("unit", "piece");
                else if (value === "animal") setValue("unit", "head");
                else setValue("unit", "unit");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="milk">Milk</SelectItem>
                <SelectItem value="egg">Egg</SelectItem>
                <SelectItem value="animal">Animal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                {...register("quantity", { required: true, min: 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit *</Label>
              <Input
                id="unit"
                {...register("unit", { required: true })}
                placeholder="liter"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="price">Price per Unit (PKR) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register("price", { required: true, min: 0 })}
              placeholder="0.00"
            />
          </div>

          {total > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">PKR {total.toLocaleString()}</div>
            </div>
          )}

          <div>
            <Label htmlFor="buyer">Buyer (Optional)</Label>
            <Input id="buyer" {...register("buyer")} placeholder="Buyer name or company" />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Additional notes..." rows={3} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Add Sale"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

