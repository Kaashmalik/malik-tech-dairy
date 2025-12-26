'use client';

import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Syringe, Heart, Calendar, User } from 'lucide-react';
import type { BreedingRecord, Animal, SemenInventory } from '@/types';
import { format, addDays } from 'date-fns';
import { GESTATION_PERIODS, BREEDING_METHODS } from '@/lib/breeding-constants';
import type { AnimalSpecies } from '@/types/database';

interface BreedingFormProps {
  animalId?: string;
  record?: Partial<BreedingRecord> | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface BreedingFormData {
  animalId: string;
  breedingDate: string;
  breedingMethod: 'natural' | 'artificial_insemination';
  sireId?: string;
  semenStrawId?: string;
  semenSource?: string;
  inseminationTechnician?: string;
  expectedDueDate?: string;
  notes?: string;
}

export function BreedingForm({ animalId, record, onClose, onSuccess }: BreedingFormProps) {
  // Fetch animals
  const { data: animalsData } = useQuery<{ animals: Animal[] }>({
    queryKey: ['animals'],
    queryFn: async () => {
      const res = await fetch('/api/animals');
      if (!res.ok) throw new Error('Failed to fetch animals');
      const response = await res.json();
      return response.data;
    },
  });

  // Fetch semen inventory for AI
  const { data: semenData } = useQuery<{ inventory: SemenInventory[] }>({
    queryKey: ['semen-inventory', 'available'],
    queryFn: async () => {
      const res = await fetch('/api/semen?availableOnly=true');
      if (!res.ok) throw new Error('Failed to fetch semen inventory');
      const response = await res.json();
      return response.data;
    },
  });

  const femaleAnimals =
    animalsData?.animals?.filter(a => a.gender === 'female' && a.status === 'active') || [];
  const maleAnimals =
    animalsData?.animals?.filter(a => a.gender === 'male' && a.status === 'active') || [];
  const availableSemen = semenData?.inventory || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BreedingFormData>({
    defaultValues: record
      ? {
        animalId: record.animalId || '',
        breedingDate: record.breedingDate
          ? format(new Date(record.breedingDate), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd'),
        breedingMethod: record.breedingMethod || 'natural',
        sireId: record.sireId || '',
        semenStrawId: record.semenStrawId || '',
        semenSource: record.semenSource || '',
        inseminationTechnician: record.inseminationTechnician || '',
        expectedDueDate: record.expectedDueDate
          ? format(new Date(record.expectedDueDate), 'yyyy-MM-dd')
          : '',
        notes: record.notes || '',
      }
      : {
        animalId: animalId || '',
        breedingDate: format(new Date(), 'yyyy-MM-dd'),
        breedingMethod: 'natural',
        sireId: '',
        semenStrawId: '',
        semenSource: '',
        inseminationTechnician: '',
        notes: '',
      },
  });

  const mutation = useMutation({
    mutationFn: async (data: BreedingFormData) => {
      const url = record?.id ? `/api/breeding/${record.id}` : '/api/breeding';
      const method = record?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save record');
      }

      return res.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const onSubmit = (data: BreedingFormData) => {
    mutation.mutate(data);
  };

  const breedingDate = watch('breedingDate');
  const breedingMethod = watch('breedingMethod');
  const selectedAnimalId = watch('animalId');
  const selectedSemenStraw = watch('semenStrawId');

  // Get selected animal's species
  const selectedAnimal = femaleAnimals.find(a => a.id === selectedAnimalId);
  const species = (selectedAnimal?.species || 'cow') as AnimalSpecies;
  const gestation = GESTATION_PERIODS[species] || GESTATION_PERIODS['cow'];

  // Get selected semen straw details
  const selectedStraw = availableSemen.find(s => s.strawCode === selectedSemenStraw);

  // Auto-calculate expected due date based on species
  if (breedingDate && selectedAnimalId) {
    const breeding = new Date(breedingDate);
    const expectedDue = addDays(breeding, gestation.average);
    const currentExpected = watch('expectedDueDate');
    const expectedFormatted = format(expectedDue, 'yyyy-MM-dd');

    if (!currentExpected || (currentExpected !== expectedFormatted && !record)) {
      setValue('expectedDueDate', expectedFormatted);
    }
  }

  // Auto-fill semen source when straw is selected
  if (selectedStraw && breedingMethod === 'artificial_insemination') {
    const currentSource = watch('semenSource');
    if (!currentSource) {
      setValue('semenSource', selectedStraw.bullName);
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          {breedingMethod === 'artificial_insemination' ? (
            <Syringe className="h-5 w-5" />
          ) : (
            <Heart className="h-5 w-5" />
          )}
          {record?.id ? 'Edit' : 'Record'} Insemination
        </CardTitle>
        <CardDescription className="text-emerald-50">
          {breedingMethod === 'artificial_insemination'
            ? 'Record artificial insemination details'
            : 'Record natural breeding event'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Breeding Method Toggle */}
          <div className="space-y-2">
            <Label>Breeding Method *</Label>
            <Tabs
              value={breedingMethod}
              onValueChange={(v) => setValue('breedingMethod', v as 'natural' | 'artificial_insemination')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="natural" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Natural Mating
                </TabsTrigger>
                <TabsTrigger value="artificial_insemination" className="flex items-center gap-2">
                  <Syringe className="h-4 w-4" />
                  AI (Artificial)
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Female Animal Selection */}
          {!animalId && (
            <div className="space-y-2">
              <Label htmlFor="animalId">Female Animal *</Label>
              <Select
                value={watch('animalId') || ''}
                onValueChange={(value) => setValue('animalId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select female animal" />
                </SelectTrigger>
                <SelectContent>
                  {femaleAnimals.map((animal) => (
                    <SelectItem key={animal.id} value={animal.id}>
                      <div className="flex items-center gap-2">
                        <span>{animal.name || animal.tag}</span>
                        <Badge variant="outline" className="text-xs">
                          {animal.species}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.animalId && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Animal is required
                </p>
              )}
            </div>
          )}

          {/* Show selected animal species info */}
          {selectedAnimal && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                <strong>{selectedAnimal.name || selectedAnimal.tag}</strong> ({selectedAnimal.species})
                <br />
                <span className="text-xs">
                  {gestation.label} period: {gestation.average} days ({gestation.min}-{gestation.max} range)
                </span>
              </p>
            </div>
          )}

          {/* Breeding Date */}
          <div className="space-y-2">
            <Label htmlFor="breedingDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Breeding Date *
            </Label>
            <Input
              id="breedingDate"
              type="date"
              {...register('breedingDate', { required: true })}
              className="dark:bg-slate-950"
            />
            {errors.breedingDate && (
              <p className="text-sm text-red-500">Breeding date is required</p>
            )}
          </div>

          {/* Natural Mating: Sire Selection */}
          {breedingMethod === 'natural' && (
            <div className="space-y-2">
              <Label htmlFor="sireId">Sire (Bull/Male Animal)</Label>
              <Select
                value={watch('sireId') || ''}
                onValueChange={(value) => setValue('sireId', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sire (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None / Unknown</SelectItem>
                  {maleAnimals
                    .filter(a => a.species === selectedAnimal?.species)
                    .map((animal) => (
                      <SelectItem key={animal.id} value={animal.id}>
                        {animal.name || animal.tag} ({animal.breed || animal.species})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* AI: Semen Straw & Source */}
          {breedingMethod === 'artificial_insemination' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="semenStrawId">Semen Straw</Label>
                <Select
                  value={watch('semenStrawId') || ''}
                  onValueChange={(value) => {
                    setValue('semenStrawId', value || undefined);
                    const straw = availableSemen.find(s => s.strawCode === value);
                    if (straw) {
                      setValue('semenSource', straw.bullName);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select from inventory (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Manual Entry</SelectItem>
                    {availableSemen
                      .filter(s => s.species === selectedAnimal?.species)
                      .map((straw) => (
                        <SelectItem key={straw.id} value={straw.strawCode}>
                          <div className="flex items-center gap-2">
                            <span>{straw.strawCode}</span>
                            <span className="text-muted-foreground">- {straw.bullName}</span>
                            <Badge variant="secondary" className="text-xs">
                              {straw.quantity} left
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semenSource">Semen Source / Bull Name *</Label>
                <Input
                  id="semenSource"
                  {...register('semenSource')}
                  placeholder="Bull name or semen ID"
                  className="dark:bg-slate-950"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inseminationTechnician" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  AI Technician
                </Label>
                <Input
                  id="inseminationTechnician"
                  {...register('inseminationTechnician')}
                  placeholder="Technician name"
                  className="dark:bg-slate-950"
                />
              </div>
            </>
          )}

          {/* Expected Due Date */}
          <div className="space-y-2">
            <Label htmlFor="expectedDueDate">Expected Due Date</Label>
            <Input
              id="expectedDueDate"
              type="date"
              {...register('expectedDueDate')}
              className="dark:bg-slate-950"
            />
            <p className="text-xs text-muted-foreground">
              Auto-calculated: {gestation.average} days from breeding date for {species}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional observations, heat signs, timing details..."
              rows={3}
              className="dark:bg-slate-950"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              {mutation.isPending ? 'Saving...' : record?.id ? 'Update' : 'Record Insemination'}
            </Button>
          </div>

          {/* Error Display */}
          {mutation.isError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {mutation.error?.message || 'Failed to save breeding record'}
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
