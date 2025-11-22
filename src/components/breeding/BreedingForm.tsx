"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { BreedingRecord, Animal } from "@/types";
import { format } from "date-fns";

interface BreedingFormProps {
  animalId?: string;
  record?: BreedingRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function BreedingForm({ animalId, record, onClose, onSuccess }: BreedingFormProps) {
  const { data: animals } = useQuery<{ animals: Animal[] }>({
    queryKey: ["animals"],
    queryFn: async () => {
      const res = await fetch("/api/animals");
      if (!res.ok) throw new Error("Failed to fetch animals");
      return res.json();
    },
  });

  const femaleAnimals = animals?.animals.filter((a) => a.gender === "female" && a.status === "active") || [];
  const maleAnimals = animals?.animals.filter((a) => a.gender === "male" && a.status === "active") || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Partial<BreedingRecord>>({
    defaultValues: record
      ? {
          animalId: record.animalId,
          breedingDate: format(new Date(record.breedingDate), "yyyy-MM-dd"),
          sireId: record.sireId || "",
          expectedCalvingDate: record.expectedCalvingDate
            ? format(new Date(record.expectedCalvingDate), "yyyy-MM-dd")
            : "",
          actualCalvingDate: record.actualCalvingDate
            ? format(new Date(record.actualCalvingDate), "yyyy-MM-dd")
            : "",
          status: record.status,
          notes: record.notes || "",
        }
      : {
          animalId: animalId || "",
          breedingDate: format(new Date(), "yyyy-MM-dd"),
          sireId: "",
          status: "pregnant",
          notes: "",
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<BreedingRecord>) => {
      const url = record
        ? `/api/breeding/${record.id}`
        : "/api/breeding";
      const method = record ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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

  const onSubmit = (data: Partial<BreedingRecord>) => {
    mutation.mutate(data);
  };

  const breedingDate = watch("breedingDate");
  const selectedAnimalId = watch("animalId");

  // Auto-calculate expected calving date (280 days)
  if (breedingDate && !record) {
    const breeding = new Date(breedingDate);
    const expectedCalving = new Date(breeding.getTime() + 280 * 24 * 60 * 60 * 1000);
    const currentExpected = watch("expectedCalvingDate");
    if (!currentExpected || currentExpected !== format(expectedCalving, "yyyy-MM-dd")) {
      setValue("expectedCalvingDate", format(expectedCalving, "yyyy-MM-dd"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{record ? "Edit" : "Add"} Breeding Record</CardTitle>
        <CardDescription>
          Record breeding information and track pregnancy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!animalId && (
            <div>
              <Label htmlFor="animalId">Female Animal *</Label>
              <Select
                value={watch("animalId") || ""}
                onValueChange={(value) => setValue("animalId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select female animal" />
                </SelectTrigger>
                <SelectContent>
                  {femaleAnimals.map((animal) => (
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
            <Label htmlFor="breedingDate">Breeding Date *</Label>
            <Input
              id="breedingDate"
              type="date"
              {...register("breedingDate", { required: true })}
            />
            {errors.breedingDate && (
              <p className="text-sm text-red-500 mt-1">Breeding date is required</p>
            )}
          </div>

          <div>
            <Label htmlFor="sireId">Sire (Male Animal)</Label>
            <Select
              value={watch("sireId") || ""}
              onValueChange={(value) => setValue("sireId", value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sire (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {maleAnimals.map((animal) => (
                  <SelectItem key={animal.id} value={animal.id}>
                    {animal.name} ({animal.tag}) - {animal.species}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="expectedCalvingDate">Expected Calving Date</Label>
            <Input
              id="expectedCalvingDate"
              type="date"
              {...register("expectedCalvingDate")}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Automatically calculated as 280 days from breeding date
            </p>
          </div>

          {record && (
            <>
              <div>
                <Label htmlFor="actualCalvingDate">Actual Calving Date</Label>
                <Input
                  id="actualCalvingDate"
                  type="date"
                  {...register("actualCalvingDate")}
                />
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={watch("status") || "pregnant"}
                  onValueChange={(value) => setValue("status", value as BreedingRecord["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pregnant">Pregnant</SelectItem>
                    <SelectItem value="calved">Calved</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Additional notes about this breeding..."
              rows={3}
            />
          </div>

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

