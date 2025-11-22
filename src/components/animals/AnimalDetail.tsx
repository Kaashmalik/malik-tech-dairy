"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ArrowLeft } from "lucide-react";
import { AnimalForm } from "./AnimalForm";
import { RealtimeMilkLogs } from "./RealtimeMilkLogs";
import { CustomFieldsRenderer } from "@/components/custom-fields/CustomFieldsRenderer";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Animal, CustomField } from "@/types";

export function AnimalDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [animalId, setAnimalId] = useState<string | null>(null);

  // Resolve params
  useEffect(() => {
    params.then((p) => setAnimalId(p.id));
  }, [params]);

  const { data: animal, isLoading, refetch } = useQuery({
    queryKey: ["animal", animalId],
    queryFn: async () => {
      if (!animalId) return null;
      const res = await fetch(`/api/animals/${animalId}`);
      if (!res.ok) throw new Error("Failed to fetch animal");
      const data = await res.json();
      return data.animal as Animal;
    },
    enabled: !!animalId,
  });

  // Fetch custom fields
  const { data: customFieldsData } = useQuery<{ fields: CustomField[] }>({
    queryKey: ["custom-fields"],
    queryFn: async () => {
      const res = await fetch("/api/tenants/custom-fields");
      if (!res.ok) return { fields: [] };
      return res.json();
    },
  });

  const handleDelete = async () => {
    if (!animalId || !confirm("Are you sure you want to delete this animal?")) {
      return;
    }

    try {
      const res = await fetch(`/api/animals/${animalId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete animal");

      toast.success("Animal deleted successfully");
      router.push("/dashboard/animals");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete animal");
    }
  };

  if (!animalId) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading animal details...</div>;
  }

  if (!animal) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Animal not found</p>
        <Button onClick={() => router.push("/dashboard/animals")}>
          Back to Animals
        </Button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="container max-w-4xl">
        <AnimalForm
          animalId={animalId}
          initialData={{
            tag: animal.tag,
            name: animal.name,
            species: animal.species,
            breed: animal.breed,
            dateOfBirth: animal.dateOfBirth
              ? new Date(animal.dateOfBirth).toISOString().split("T")[0]
              : "",
            gender: animal.gender,
            photoUrl: animal.photoUrl,
            purchaseDate: animal.purchaseDate
              ? new Date(animal.purchaseDate).toISOString().split("T")[0]
              : undefined,
            purchasePrice: animal.purchasePrice,
            customFields: animal.customFields,
          }}
          onSuccess={() => {
            setIsEditing(false);
            refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{animal.tag}</CardTitle>
              {animal.name && (
                <CardDescription className="text-lg">{animal.name}</CardDescription>
              )}
            </div>
            {animal.photoUrl && (
              <img
                src={animal.photoUrl}
                alt={animal.name || animal.tag}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Species
              </label>
              <p className="text-lg capitalize">{animal.species}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Breed
              </label>
              <p className="text-lg">{animal.breed || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Gender
              </label>
              <p className="text-lg capitalize">{animal.gender}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <p className="text-lg capitalize">{animal.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Date of Birth
              </label>
              <p className="text-lg">
                {animal.dateOfBirth
                  ? new Date(animal.dateOfBirth).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            {animal.purchaseDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Purchase Date
                </label>
                <p className="text-lg">
                  {new Date(animal.purchaseDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {animal.purchasePrice && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Purchase Price
                </label>
                <p className="text-lg">PKR {animal.purchasePrice.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          {customFieldsData?.fields && customFieldsData.fields.length > 0 && animal.customFields && (
            <div className="mt-6 pt-6 border-t">
              <CustomFieldsRenderer
                fields={customFieldsData.fields}
                values={animal.customFields}
                readOnly={true}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Milk Logs */}
      {animalId && <RealtimeMilkLogs animalId={animalId} />}
    </div>
  );
}

