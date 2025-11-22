"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomField } from "@/types";

interface CustomFieldsRendererProps {
  fields: CustomField[];
  values?: Record<string, string | number | Date>;
  onChange?: (fieldId: string, value: string | number | Date) => void;
  readOnly?: boolean;
}

export function CustomFieldsRenderer({
  fields,
  values = {},
  onChange,
  readOnly = false,
}: CustomFieldsRendererProps) {
  if (!fields || fields.length === 0) {
    return null;
  }

  const handleChange = (fieldId: string, value: string | number | Date) => {
    if (onChange) {
      onChange(fieldId, value);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Additional Information</h3>
      {fields.map((field) => {
        const value = values[field.id];
        const displayValue =
          value instanceof Date
            ? value.toISOString().split("T")[0]
            : value?.toString() || field.defaultValue?.toString() || "";

        if (readOnly) {
          return (
            <div key={field.id}>
              <Label className="text-sm font-medium text-muted-foreground">
                {field.name}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <p className="text-lg mt-1">
                {field.type === "dropdown"
                  ? displayValue || "N/A"
                  : field.type === "date"
                  ? displayValue
                    ? new Date(displayValue).toLocaleDateString()
                    : "N/A"
                  : displayValue || "N/A"}
              </p>
            </div>
          );
        }

        return (
          <div key={field.id}>
            <Label>
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.type === "dropdown" ? (
              <select
                value={displayValue}
                onChange={(e) => handleChange(field.id, e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                required={field.required}
              >
                <option value="">Select {field.name}</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                value={displayValue}
                onChange={(e) => {
                  const newValue =
                    field.type === "number"
                      ? parseFloat(e.target.value) || 0
                      : field.type === "date"
                      ? e.target.value
                      : e.target.value;
                  handleChange(field.id, newValue);
                }}
                required={field.required}
                className="mt-1"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

