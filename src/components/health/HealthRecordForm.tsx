"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { HealthRecord, Animal } from "@/types";
import { format } from "date-fns";

interface HealthRecordFormProps {
  animalId?: string;
  record?: HealthRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function HealthRecordForm({ animalId, record, onClose, onSuccess }: HealthRecordFormProps) {
  const { data: animals } = useQuery<{ animals: Animal[] }>({
    queryKey: ["animals"],
    queryFn: async () => {
      const res = await fetch("/api/animals");
      if (!res.ok) throw new Error("Failed to fetch animals");
      return res.json();
    },
    enabled: !animalId, // Only fetch if we need to select animal
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Partial<HealthRecord>>({
    defaultValues: record
      ? {
          animalId: record.animalId,
          type: record.type,
          date: format(new Date(record.date), "yyyy-MM-dd"),
          description: record.description,
          veterinarian: record.veterinarian || "",
          cost: record.cost?.toString() || "",
          nextDueDate: record.nextDueDate
            ? format(new Date(record.nextDueDate), "yyyy-MM-dd")
            : "",
        }
      : {
          animalId: animalId || "",
          type: "checkup",
          date: format(new Date(), "yyyy-MM-dd"),
          description: "",
          veterinarian: "",
          cost: "",
          nextDueDate: "",
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<HealthRecord>) => {
      const url = record
        ? `/api/health/records/${record.id}`
        : "/api/health/records";
      const method = record ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          cost: data.cost ? parseFloat(data.cost.toString()) : undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save record");
      }

      return res.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = (data: Partial<HealthRecord>) => {
    mutation.mutate(data);
  };

  const selectedType = watch("type");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{record ? "Edit" : "Add"} Health Record</CardTitle>
        <CardDescription>
          Record vaccination, treatment, checkup, or disease information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!animalId && (
            <div>
              <Label htmlFor="animalId">Animal *</Label>
              <Select
                value={watch("animalId") || ""}
                onValueChange={(value) => setValue("animalId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select animal" />
                </SelectTrigger>
                <SelectContent>
                  {animals?.animals.map((animal) => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {animal.name} ({animal.tag}) - {animal.species}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.animalId && (
                <p className="text-sm text-red-500 mt-1">Animal is required</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="type">Type *</Label>
            <Select
              value={watch("type") || "checkup"}
              onValueChange={(value) => setValue("type", value as HealthRecord["type"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vaccination">Vaccination</SelectItem>
                <SelectItem value="treatment">Treatment</SelectItem>
                <SelectItem value="checkup">Checkup</SelectItem>
                <SelectItem value="disease">Disease</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              {...register("date", { required: true })}
            />
            {errors.date && (
              <p className="text-sm text-red-500 mt-1">Date is required</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register("description", { required: true })}
              placeholder="Describe the health event..."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">Description is required</p>
            )}
          </div>

          <div>
            <Label htmlFor="veterinarian">Veterinarian</Label>
            <Input
              id="veterinarian"
              {...register("veterinarian")}
              placeholder="Dr. Name or Clinic"
            />
          </div>

          <div>
            <Label htmlFor="cost">Cost (PKR)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              {...register("cost")}
              placeholder="0.00"
            />
          </div>

          {(selectedType === "vaccination" || selectedType === "treatment") && (
            <div>
              <Label htmlFor="nextDueDate">Next Due Date</Label>
              <Input
                id="nextDueDate"
                type="date"
                {...register("nextDueDate")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Set a reminder for the next vaccination or treatment
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : record ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

