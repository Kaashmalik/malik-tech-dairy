"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { usePostHogAnalytics } from "@/hooks/usePostHog";

interface MilkLogFormData {
  animalId: string;
  date: string;
  session: "morning" | "evening";
  quantity: number;
  quality?: number;
  notes?: string;
}

interface MilkLogFormProps {
  animalId?: string;
  onSuccess?: () => void;
}

export function MilkLogForm({ animalId, onSuccess }: MilkLogFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackMilkLog } = usePostHogAnalytics();

  // Fetch animals for dropdown
  const { data: animalsData } = useQuery({
    queryKey: ["animals"],
    queryFn: async () => {
      const res = await fetch("/api/animals");
      if (!res.ok) return { animals: [] };
      return res.json();
    },
  });

  const animals = animalsData?.animals || [];
  const dairyAnimals = animals.filter(
    (a: any) => a.species === "cow" || a.species === "buffalo"
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MilkLogFormData>({
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      session: "morning",
      animalId: animalId || "",
    },
  });

  const onSubmit = async (data: MilkLogFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/milk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save milk log");
      }

      toast.success("Milk log created successfully");
      
      // Track event
      trackMilkLog({
        animalId: data.animalId,
        quantity: data.quantity,
        session: data.session,
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/milk");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Milk Production</CardTitle>
        <CardDescription>Record milk production for an animal</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Animal *</label>
            <select
              {...register("animalId", { required: "Animal is required" })}
              className="w-full mt-1 px-3 py-2 border rounded-md"
              disabled={!!animalId}
            >
              <option value="">Select animal</option>
              {dairyAnimals.map((animal: any) => (
                <option key={animal.id} value={animal.id}>
                  {animal.tag} {animal.name ? `- ${animal.name}` : ""} ({animal.species})
                </option>
              ))}
            </select>
            {errors.animalId && (
              <p className="text-sm text-destructive mt-1">
                {errors.animalId.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Date *</label>
              <input
                type="date"
                {...register("date", { required: "Date is required" })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
              {errors.date && (
                <p className="text-sm text-destructive mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Session *</label>
              <select
                {...register("session", { required: "Session is required" })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </select>
              {errors.session && (
                <p className="text-sm text-destructive mt-1">
                  {errors.session.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Quantity (Liters) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register("quantity", {
                  required: "Quantity is required",
                  min: { value: 0, message: "Quantity must be positive" },
                  max: { value: 100, message: "Quantity must be less than 100L" },
                })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="0.00"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive mt-1">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Quality (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                {...register("quality", {
                  min: { value: 1, message: "Quality must be between 1-10" },
                  max: { value: 10, message: "Quality must be between 1-10" },
                  valueAsNumber: true,
                })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              {...register("notes")}
              className="w-full mt-1 px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Log Milk"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

