"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CustomField } from "@/types";

export function CustomFieldsForm() {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState<CustomField[]>([]);

  const { data, isLoading } = useQuery<{ fields: CustomField[] }>({
    queryKey: ["custom-fields"],
    queryFn: async () => {
      const res = await fetch("/api/tenants/custom-fields");
      if (!res.ok) throw new Error("Failed to fetch custom fields");
      return res.json();
    },
    onSuccess: (data) => {
      setFields(data.fields || []);
    },
  });

  const mutation = useMutation({
    mutationFn: async (fields: CustomField[]) => {
      const res = await fetch("/api/tenants/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) throw new Error("Failed to save custom fields");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
      toast.success("Custom fields saved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save custom fields");
    },
  });

  const addField = () => {
    setFields([
      ...fields,
      {
        id: `field_${Date.now()}`,
        name: "",
        type: "text",
        required: false,
      },
    ]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<CustomField>) => {
    setFields(fields.map((field, i) => (i === index ? { ...field, ...updates } : field)));
  };

  const handleSave = () => {
    // Validate fields
    const invalidFields = fields.filter(
      (f) => !f.name.trim() || (f.type === "dropdown" && (!f.options || f.options.length === 0))
    );

    if (invalidFields.length > 0) {
      toast.error("Please fill in all required field information");
      return;
    }

    mutation.mutate(fields);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Animal Fields</CardTitle>
        <CardDescription>
          Define additional fields to track for your animals (e.g., weight, vaccination status, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Field {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Field Name</Label>
                  <Input
                    value={field.name}
                    onChange={(e) => updateField(index, { name: e.target.value })}
                    placeholder="e.g., Weight, Vaccination Status"
                  />
                </div>

                <div>
                  <Label>Field Type</Label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(index, {
                        type: e.target.value as CustomField["type"],
                        options: e.target.value === "dropdown" ? [] : undefined,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="dropdown">Dropdown</option>
                  </select>
                </div>

                <div>
                  <Label>
                    <input
                      type="checkbox"
                      checked={field.required || false}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="mr-2"
                    />
                    Required
                  </Label>
                </div>

                {field.type === "dropdown" && (
                  <div>
                    <Label>Options (comma-separated)</Label>
                    <Input
                      value={field.options?.join(", ") || ""}
                      onChange={(e) =>
                        updateField(index, {
                          options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="e.g., Yes, No, Pending"
                    />
                  </div>
                )}

                {field.type !== "dropdown" && (
                  <div>
                    <Label>Default Value (optional)</Label>
                    <Input
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                      value={field.defaultValue?.toString() || ""}
                      onChange={(e) => {
                        const value =
                          field.type === "number"
                            ? parseFloat(e.target.value) || undefined
                            : e.target.value;
                        updateField(index, { defaultValue: value });
                      }}
                      placeholder="Default value"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addField}>
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>

          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Custom Fields"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

