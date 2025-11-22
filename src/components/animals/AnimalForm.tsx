"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ANIMAL_BREEDS } from "@/lib/constants";
import type { AnimalSpecies } from "@/types";
import { useTenantLimits } from "@/hooks/useTenantLimits";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AnimalFormData {
  tag: string;
  name: string;
  species: AnimalSpecies;
  breed: string;
  dateOfBirth: string;
  gender: "male" | "female";
  photoUrl?: string;
  purchaseDate?: string;
  purchasePrice?: number;
}

interface AnimalFormProps {
  animalId?: string;
  initialData?: Partial<AnimalFormData>;
  onSuccess?: () => void;
}

export function AnimalForm({ animalId, initialData, onSuccess }: AnimalFormProps) {
  const router = useRouter();
  const { canAddAnimal } = useTenantLimits();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<AnimalSpecies>(
    initialData?.species || "cow"
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnimalFormData>({
    defaultValues: initialData,
  });

  const onSubmit = async (data: AnimalFormData) => {
    if (!canAddAnimal && !animalId) {
      toast.error("Animal limit reached. Please upgrade your plan.");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = animalId ? `/api/animals/${animalId}` : "/api/animals";
      const method = animalId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save animal");
      }

      toast.success(animalId ? "Animal updated successfully" : "Animal created successfully");
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/animals");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const breeds = ANIMAL_BREEDS[selectedSpecies] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{animalId ? "Edit Animal" : "Add New Animal"}</CardTitle>
        <CardDescription>
          {animalId
            ? "Update animal information"
            : "Add a new animal to your farm"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Tag Number *</label>
              <input
                {...register("tag", { required: "Tag number is required" })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="e.g., COW-001"
              />
              {errors.tag && (
                <p className="text-sm text-destructive mt-1">{errors.tag.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                {...register("name")}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="e.g., Bella"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Species *</label>
              <select
                {...register("species", { required: "Species is required" })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                onChange={(e) => setSelectedSpecies(e.target.value as AnimalSpecies)}
              >
                <option value="cow">Cow</option>
                <option value="buffalo">Buffalo</option>
                <option value="chicken">Chicken (Poultry)</option>
                <option value="goat">Goat</option>
                <option value="sheep">Sheep</option>
                <option value="horse">Horse</option>
              </select>
              {errors.species && (
                <p className="text-sm text-destructive mt-1">{errors.species.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Breed</label>
              <select
                {...register("breed")}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="">Select breed</option>
                {breeds.map((breed) => (
                  <option key={breed} value={breed}>
                    {breed}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Date of Birth *</label>
              <input
                type="date"
                {...register("dateOfBirth", { required: "Date of birth is required" })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-destructive mt-1">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Gender *</label>
              <select
                {...register("gender", { required: "Gender is required" })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && (
                <p className="text-sm text-destructive mt-1">{errors.gender.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Purchase Date</label>
              <input
                type="date"
                {...register("purchaseDate")}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Purchase Price (PKR)</label>
              <input
                type="number"
                {...register("purchasePrice", { valueAsNumber: true })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : animalId ? "Update Animal" : "Add Animal"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

