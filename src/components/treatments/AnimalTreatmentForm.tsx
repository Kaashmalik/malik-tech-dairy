"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, AlertCircle, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const treatmentSchema = z.object({
  animal_id: z.string().min(1, "Animal is required"),
  disease_id: z.string().optional(),
  condition_name: z.string().optional(),
  symptoms_observed: z.array(z.string()).optional(),
  diagnosis_date: z.date(),
  diagnosed_by: z.string().min(1, "Diagnosed by is required"),
  diagnosis_method: z.string().optional(),
  severity: z.enum(["mild", "moderate", "severe", "critical"]).default("moderate"),
  treatment_protocol_id: z.string().optional(),
  treatment_start_date: z.date(),
  treatment_end_date: z.date().optional(),
  medicines_given: z.array(z.object({
    medicine_id: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
  })).optional(),
  status: z.enum(["in_treatment", "recovering", "recovered", "chronic", "deceased"]).default("in_treatment"),
  outcome_notes: z.string().optional(),
  follow_up_required: z.boolean().default(false),
  next_follow_up_date: z.date().optional(),
  total_cost: z.number().optional(),
  notes: z.string().optional(),
});

type TreatmentFormData = z.infer<typeof treatmentSchema>;

interface Animal {
  id: string;
  tagId: string;
  name?: string;
  species: string;
  breed: string;
}

interface Disease {
  id: string;
  name: string;
  category: string;
  symptoms: string[];
}

interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  form: string;
  dosagePerKg?: string;
}

interface TreatmentProtocol {
  id: string;
  name: string;
  severity_level?: string;
  steps: any[];
  medicines_required: any[];
}

interface AnimalTreatmentFormProps {
  animalId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AnimalTreatmentForm({ animalId, onSuccess, onCancel }: AnimalTreatmentFormProps) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [protocols, setProtocols] = useState<TreatmentProtocol[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [customSymptoms, setCustomSymptoms] = useState<string>("");
  const [medicinesList, setMedicinesList] = useState<TreatmentFormData["medicines_given"]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
    reset,
  } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      diagnosis_date: new Date(),
      treatment_start_date: new Date(),
      symptoms_observed: [],
      medicines_given: [],
    },
  });

  const watchedAnimalId = watch("animal_id");
  const watchedDiseaseId = watch("disease_id");
  const watchedSeverity = watch("severity");
  const followUpRequired = watch("follow_up_required");

  useEffect(() => {
    fetchAnimals();
    fetchDiseases();
    fetchMedicines();
  }, []);

  useEffect(() => {
    if (animalId) {
      setValue("animal_id", animalId);
    }
  }, [animalId, setValue]);

  useEffect(() => {
    if (watchedDiseaseId) {
      const disease = diseases.find((d) => d.id === watchedDiseaseId);
      setSelectedDisease(disease || null);
      if (disease) {
        setValue("symptoms_observed", disease.symptoms.slice(0, 3));
      }
    }
  }, [watchedDiseaseId, diseases, setValue]);

  useEffect(() => {
    if (watchedDiseaseId && watchedSeverity) {
      fetchProtocols();
    }
  }, [watchedDiseaseId, watchedSeverity]);

  const fetchAnimals = async () => {
    try {
      const response = await fetch("/api/animals");
      const data = await response.json();
      if (data.success) {
        setAnimals(data.data);
      }
    } catch (error) {
      console.error("Error fetching animals:", error);
    }
  };

  const fetchDiseases = async () => {
    try {
      const response = await fetch("/api/diseases");
      const data = await response.json();
      if (data.success) {
        setDiseases(data.data);
      }
    } catch (error) {
      console.error("Error fetching diseases:", error);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await fetch("/api/medicines?available_only=true");
      const data = await response.json();
      if (data.success) {
        setMedicines(data.data);
      }
    } catch (error) {
      console.error("Error fetching medicines:", error);
    }
  };

  const fetchProtocols = async () => {
    if (!watchedDiseaseId || !watchedSeverity) return;
    
    try {
      const response = await fetch(`/api/treatment-protocols?disease_id=${watchedDiseaseId}&severity=${watchedSeverity}`);
      const data = await response.json();
      if (data.success) {
        setProtocols(data.data);
      }
    } catch (error) {
      console.error("Error fetching protocols:", error);
    }
  };

  const handleSymptomToggle = (symptom: string) => {
    const currentSymptoms = getValues("symptoms_observed") || [];
    const newSymptoms = currentSymptoms.includes(symptom)
      ? currentSymptoms.filter((s) => s !== symptom)
      : [...currentSymptoms, symptom];
    setValue("symptoms_observed", newSymptoms);
  };

  const handleAddCustomSymptom = () => {
    if (customSymptoms.trim()) {
      const currentSymptoms = getValues("symptoms_observed") || [];
      setValue("symptoms_observed", [...currentSymptoms, customSymptoms.trim()]);
      setCustomSymptoms("");
    }
  };

  const addMedicine = () => {
    const newMedicine = {
      medicine_id: "",
      dosage: "",
      frequency: "",
      duration: "",
    };
    setMedicinesList([...medicinesList, newMedicine]);
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const updated = [...medicinesList];
    updated[index] = { ...updated[index], [field]: value };
    setMedicinesList(updated);
    setValue("medicines_given", updated);
  };

  const removeMedicine = (index: number) => {
    const updated = medicinesList.filter((_, i) => i !== index);
    setMedicinesList(updated);
    setValue("medicines_given", updated);
  };

  const onSubmit = async (data: TreatmentFormData) => {
    try {
      setLoading(true);
      
      const payload = {
        ...data,
        diagnosis_date: data.diagnosis_date.toISOString(),
        treatment_start_date: data.treatment_start_date.toISOString(),
        treatment_end_date: data.treatment_end_date?.toISOString(),
        next_follow_up_date: data.next_follow_up_date?.toISOString(),
      };

      const response = await fetch("/api/animal-treatments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Treatment recorded successfully");
        reset();
        setMedicinesList([]);
        setSelectedDisease(null);
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || "Failed to record treatment");
      }
    } catch (error) {
      console.error("Error submitting treatment:", error);
      toast.error("Error recording treatment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Record Animal Treatment
          </CardTitle>
          <CardDescription>
            Record diagnosis and treatment details for the animal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Animal Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="animal_id">Animal *</Label>
                <Select
                  value={watchedAnimalId}
                  onValueChange={(value) => setValue("animal_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an animal" />
                  </SelectTrigger>
                  <SelectContent>
                    {animals.map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.tagId} - {animal.name || "Unnamed"} ({animal.species} - {animal.breed})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.animal_id && (
                  <p className="text-sm text-red-500 mt-1">{errors.animal_id.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="diagnosed_by">Diagnosed By *</Label>
                <Input
                  id="diagnosed_by"
                  {...register("diagnosed_by")}
                  placeholder="Veterinarian name"
                />
                {errors.diagnosed_by && (
                  <p className="text-sm text-red-500 mt-1">{errors.diagnosed_by.message}</p>
                )}
              </div>
            </div>

            {/* Disease Selection */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="disease_id">Disease (if known)</Label>
                <Select
                  value={watchedDiseaseId}
                  onValueChange={(value) => setValue("disease_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select or search disease" />
                  </SelectTrigger>
                  <SelectContent>
                    {diseases.map((disease) => (
                      <SelectItem key={disease.id} value={disease.id}>
                        {disease.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!watchedDiseaseId && (
                <div>
                  <Label htmlFor="condition_name">Condition Name</Label>
                  <Input
                    id="condition_name"
                    {...register("condition_name")}
                    placeholder="Describe the condition"
                  />
                </div>
              )}
            </div>

            {/* Symptoms */}
            <div className="space-y-3">
              <Label>Symptoms Observed</Label>
              {selectedDisease && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedDisease.symptoms.map((symptom) => (
                    <div key={symptom} className="flex items-center space-x-2">
                      <Checkbox
                        id={`symptom-${symptom}`}
                        checked={getValues("symptoms_observed")?.includes(symptom)}
                        onCheckedChange={() => handleSymptomToggle(symptom)}
                      />
                      <Label htmlFor={`symptom-${symptom}`} className="text-sm">
                        {symptom}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom symptom"
                  value={customSymptoms}
                  onChange={(e) => setCustomSymptoms(e.target.value)}
                />
                <Button type="button" onClick={handleAddCustomSymptom}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Diagnosis Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Diagnosis Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watch("diagnosis_date") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch("diagnosis_date") ? (
                        format(watch("diagnosis_date"), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={watch("diagnosis_date")}
                      onSelect={(date) => date && setValue("diagnosis_date", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="diagnosis_method">Diagnosis Method</Label>
                <Select
                  value={watch("diagnosis_method")}
                  onValueChange={(value) => setValue("diagnosis_method", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinical_exam">Clinical Examination</SelectItem>
                    <SelectItem value="lab_test">Laboratory Test</SelectItem>
                    <SelectItem value="ultrasound">Ultrasound</SelectItem>
                    <SelectItem value="x_ray">X-Ray</SelectItem>
                    <SelectItem value="necropsy">Necropsy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={watch("severity")}
                  onValueChange={(value: any) => setValue("severity", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Treatment Protocol */}
            {protocols.length > 0 && (
              <div>
                <Label htmlFor="treatment_protocol_id">Treatment Protocol</Label>
                <Select
                  value={watch("treatment_protocol_id")}
                  onValueChange={(value) => setValue("treatment_protocol_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    {protocols.map((protocol) => (
                      <SelectItem key={protocol.id} value={protocol.id}>
                        {protocol.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* Treatment Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Treatment Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watch("treatment_start_date") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch("treatment_start_date") ? (
                        format(watch("treatment_start_date"), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={watch("treatment_start_date")}
                      onSelect={(date) => date && setValue("treatment_start_date", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Treatment End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watch("treatment_end_date") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch("treatment_end_date") ? (
                        format(watch("treatment_end_date"), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={watch("treatment_end_date")}
                      onSelect={(date) => date && setValue("treatment_end_date", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Medicines */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Medicines Administered</Label>
                <Button type="button" onClick={addMedicine} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medicine
                </Button>
              </div>

              {medicinesList.map((medicine, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <Select
                    value={medicine.medicine_id}
                    onValueChange={(value) => updateMedicine(index, "medicine_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Medicine" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines.map((med) => (
                        <SelectItem key={med.id} value={med.id}>
                          {med.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Dosage"
                    value={medicine.dosage}
                    onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                  />

                  <Input
                    placeholder="Frequency"
                    value={medicine.frequency}
                    onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                  />

                  <Input
                    placeholder="Duration"
                    value={medicine.duration}
                    onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeMedicine(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            {/* Status and Follow-up */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value: any) => setValue("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_treatment">In Treatment</SelectItem>
                    <SelectItem value="recovering">Recovering</SelectItem>
                    <SelectItem value="recovered">Recovered</SelectItem>
                    <SelectItem value="chronic">Chronic</SelectItem>
                    <SelectItem value="deceased">Deceased</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="follow_up_required"
                  checked={followUpRequired}
                  onCheckedChange={(checked) => setValue("follow_up_required", checked as boolean)}
                />
                <Label htmlFor="follow_up_required">Follow-up Required</Label>
              </div>

              {followUpRequired && (
                <div>
                  <Label>Next Follow-up Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !watch("next_follow_up_date") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("next_follow_up_date") ? (
                          format(watch("next_follow_up_date"), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watch("next_follow_up_date")}
                        onSelect={(date) => date && setValue("next_follow_up_date", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Any additional notes about the treatment..."
                rows={3}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Record Treatment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
