"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus, Calendar, DollarSign, User, AlertCircle } from "lucide-react";
import Link from "next/link";
import { HealthRecordForm } from "./HealthRecordForm";
import { useState } from "react";
import type { HealthRecord, Animal } from "@/types";

interface HealthRecordsListProps {
  animalId?: string;
}

export function HealthRecordsList({ animalId }: HealthRecordsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ records: HealthRecord[] }>({
    queryKey: ["health-records", animalId],
    queryFn: async () => {
      const url = animalId
        ? `/api/health/records?animalId=${animalId}`
        : "/api/health/records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch records");
      return res.json();
    },
  });

  const { data: animals } = useQuery<{ animals: Animal[] }>({
    queryKey: ["animals"],
    queryFn: async () => {
      const res = await fetch("/api/animals");
      if (!res.ok) throw new Error("Failed to fetch animals");
      return res.json();
    },
    enabled: !animalId, // Only fetch if we need to show animal names
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/health/records/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete record");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-records"] });
    },
  });

  const getTypeColor = (type: HealthRecord["type"]) => {
    switch (type) {
      case "vaccination":
        return "bg-green-100 text-green-800";
      case "treatment":
        return "bg-blue-100 text-blue-800";
      case "checkup":
        return "bg-purple-100 text-purple-800";
      case "disease":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAnimalName = (id: string) => {
    if (!animals) return id;
    const animal = animals.animals.find((a) => a.id === id);
    return animal ? `${animal.name} (${animal.tag})` : id;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading health records...</div>;
  }

  const records = data?.records || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Health Records</h2>
          <p className="text-muted-foreground">
            Track vaccinations, treatments, checkups, and diseases
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Record
        </Button>
      </div>

      {showForm && (
        <HealthRecordForm
          animalId={animalId}
          record={editingRecord}
          onClose={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingRecord(null);
            queryClient.invalidateQueries({ queryKey: ["health-records"] });
          }}
        />
      )}

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No health records yet</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Record
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">
                        {!animalId && (
                          <Link
                            href={`/dashboard/animals/${record.animalId}`}
                            className="hover:underline"
                          >
                            {getAnimalName(record.animalId)}
                          </Link>
                        )}
                        {animalId && "Health Record"}
                      </CardTitle>
                      <Badge className={getTypeColor(record.type)}>
                        {record.type}
                      </Badge>
                    </div>
                    <CardDescription>{record.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingRecord(record);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this record?")) {
                          deleteMutation.mutate(record.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span>{format(new Date(record.date), "MMM d, yyyy")}</span>
                  </div>
                  {record.veterinarian && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Vet:</span>
                      <span>{record.veterinarian}</span>
                    </div>
                  )}
                  {record.cost && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Cost:</span>
                      <span>PKR {record.cost.toLocaleString()}</span>
                    </div>
                  )}
                  {record.nextDueDate && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-muted-foreground">Next Due:</span>
                      <span className="font-semibold">
                        {format(new Date(record.nextDueDate), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

