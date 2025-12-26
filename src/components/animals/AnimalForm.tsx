'use client';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ANIMAL_BREEDS } from '@/lib/constants';
import type { AnimalSpecies, CustomField } from '@/types';
import { useTenantLimits } from '@/hooks/useTenantLimits';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { usePostHogAnalytics } from '@/hooks/usePostHog';
import { useOfflineCreateAnimal, useOfflineUpdateAnimal } from '@/lib/offline/hooks';
import { CustomFieldsRenderer } from '@/components/custom-fields/CustomFieldsRenderer';
import {
  Beef,
  Camera,
  Upload,
  X,
  Loader2,
  Calendar,
  DollarSign,
  Tag,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info,
  ImageIcon,
} from 'lucide-react';
interface AnimalFormData {
  tag: string;
  name: string;
  species: AnimalSpecies;
  breed: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  photoUrl?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  customFields?: Record<string, string | number | Date>;
}
interface AnimalFormProps {
  animalId?: string;
  initialData?: Partial<AnimalFormData>;
  onSuccess?: () => void;
}
const speciesConfig = {
  cow: { emoji: '🐄', color: 'from-amber-500 to-orange-600' },
  buffalo: { emoji: '🐃', color: 'from-gray-600 to-slate-700' },
  chicken: { emoji: '🐔', color: 'from-yellow-500 to-amber-600' },
  goat: { emoji: '🐐', color: 'from-emerald-500 to-teal-600' },
  sheep: { emoji: '🐑', color: 'from-gray-400 to-gray-500' },
  horse: { emoji: '🐴', color: 'from-amber-600 to-brown-600' },
};
export function AnimalForm({ animalId, initialData, onSuccess }: AnimalFormProps) {
  const router = useRouter();
  const { canAddAnimal, currentAnimalCount, maxAnimals } = useTenantLimits();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackAnimalCreation } = usePostHogAnalytics();
  const [selectedSpecies, setSelectedSpecies] = useState<AnimalSpecies>(
    initialData?.species || 'cow'
  );
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, string | number | Date>
  >(initialData?.customFields || {});
  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.photoUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Fetch custom fields
  const { data: customFieldsData } = useQuery<{ fields: CustomField[] }>({
    queryKey: ['custom-fields'],
    queryFn: async () => {
      const res = await fetch('/api/tenants/custom-fields');
      if (!res.ok) return { fields: [] };
      return res.json();
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AnimalFormData>({
    defaultValues: initialData,
  });
  // Handle image upload
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    // Upload to server
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'animal');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      const data = await response.json();
      setValue('photoUrl', data.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };
  const removeImage = () => {
    setImagePreview(null);
    setValue('photoUrl', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  // Offline mutation hooks
  const createAnimal = useOfflineCreateAnimal(initialData?.customFields?.tenantId as string || 'default-tenant'); // TODO: Get actual tenantId
  const updateAnimal = useOfflineUpdateAnimal(initialData?.customFields?.tenantId as string || 'default-tenant');

  const onSubmit = async (data: AnimalFormData) => {
    if (!canAddAnimal && !animalId) {
      toast.error('Animal limit reached. Please upgrade your plan.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (animalId) {
        await updateAnimal.mutateAsync({ id: animalId, ...data });
        toast.success('Animal updated successfully');
      } else {
        await createAnimal.mutateAsync({ ...data, tenantId: 'default-tenant' }); // Ensure tenantId is passed
        toast.success('Animal created successfully');
        trackAnimalCreation({
          species: data.species,
          breed: data.breed,
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/animals');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  const breeds = ANIMAL_BREEDS[selectedSpecies] || [];
  const speciesInfo = speciesConfig[selectedSpecies] || speciesConfig.cow;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <Card className="overflow-hidden border-0 shadow-xl">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${speciesInfo.color} p-6 text-white`}>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur">
              {speciesInfo.emoji}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {animalId ? 'Edit Animal' : 'Add New Animal'}
              </h1>
              <p className="text-white/80">
                {animalId ? 'Update animal information' : 'Register a new animal to your farm'}
              </p>
            </div>
          </div>
          {/* Animal limit indicator */}
          {!animalId && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur">
              <Info className="h-4 w-4" />
              <span className="text-sm">
                {maxAnimals === -1
                  ? `${currentAnimalCount} animals registered (Unlimited)`
                  : `${currentAnimalCount} of ${maxAnimals} animals used`}
              </span>
              {!canAddAnimal && (
                <Badge variant="secondary" className="ml-auto bg-red-500/20 text-white">
                  Limit Reached
                </Badge>
              )}
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload Section */}
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Animal Photo
              </label>
              <div className="flex items-center gap-4">
                <div
                  className="relative h-32 w-32 overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-slate-600 dark:bg-slate-800"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                        className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <div className="flex h-full cursor-pointer flex-col items-center justify-center text-gray-400 hover:text-emerald-500 dark:text-slate-500">
                      <Camera className="mb-2 h-8 w-8" />
                      <span className="text-xs">Add Photo</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Upload a photo of your animal. This helps with identification.
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
                    Supported: JPG, PNG, GIF (max 5MB)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Choose Image
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            {/* Main form fields */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Tag Number */}
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <Tag className="h-4 w-4 text-emerald-500" />
                  Tag Number *
                </label>
                <Input
                  {...register('tag', { required: 'Tag number is required' })}
                  placeholder="e.g., COW-001"
                  className={`h-11 ${errors.tag ? 'border-red-500' : ''}`}
                />
                {errors.tag && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    {errors.tag.message}
                  </p>
                )}
              </div>
              {/* Name */}
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Name (Optional)
                </label>
                <Input
                  {...register('name')}
                  placeholder="e.g., Bella"
                  className="h-11"
                />
              </div>
            </div>
            {/* Species Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Species *
              </label>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                {(Object.entries(speciesConfig) as [AnimalSpecies, typeof speciesConfig.cow][]).map(
                  ([key, config]) => (
                    <motion.button
                      key={key}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedSpecies(key);
                        setValue('species', key);
                      }}
                      className={`flex flex-col items-center rounded-xl border-2 p-3 transition-all ${selectedSpecies === key
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-slate-800'
                        }`}
                    >
                      <span className="text-2xl">{config.emoji}</span>
                      <span className="mt-1 text-xs font-medium capitalize">{key}</span>
                      {selectedSpecies === key && (
                        <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-500" />
                      )}
                    </motion.button>
                  )
                )}
              </div>
              <input type="hidden" {...register('species', { required: true })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Breed */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Breed
                </label>
                <select
                  {...register('breed')}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">Select breed</option>
                  {breeds.map((breed) => (
                    <option key={breed} value={breed}>
                      {breed}
                    </option>
                  ))}
                </select>
              </div>
              {/* Gender */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Gender *
                </label>
                <div className="flex gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setValue('gender', 'male')}
                    className={`flex-1 rounded-lg border-2 p-3 text-center font-medium transition-all ${watch('gender') === 'male'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-slate-700'
                      }`}
                  >
                    ♂️ Male
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setValue('gender', 'female')}
                    className={`flex-1 rounded-lg border-2 p-3 text-center font-medium transition-all ${watch('gender') === 'female'
                      ? 'border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-slate-700'
                      }`}
                  >
                    ♀️ Female
                  </motion.button>
                </div>
                <input type="hidden" {...register('gender', { required: 'Gender is required' })} />
                {errors.gender && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Date of Birth */}
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Date of Birth *
                </label>
                <Input
                  type="date"
                  {...register('dateOfBirth', { required: 'Date of birth is required' })}
                  className={`h-11 ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>
              {/* Purchase Date */}
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Purchase Date
                </label>
                <Input
                  type="date"
                  {...register('purchaseDate')}
                  className="h-11"
                />
              </div>
            </div>
            {/* Purchase Price */}
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Purchase Price (PKR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">PKR</span>
                <Input
                  type="number"
                  {...register('purchasePrice', { valueAsNumber: true })}
                  className="h-11 pl-14"
                  placeholder="0"
                />
              </div>
            </div>
            {/* Custom Fields */}
            {customFieldsData?.fields && customFieldsData.fields.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Custom Fields
                </h3>
                <CustomFieldsRenderer
                  fields={customFieldsData.fields}
                  values={customFieldValues}
                  onChange={(fieldId, value) => {
                    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: value }));
                  }}
                />
              </div>
            )}
            {/* Submit buttons */}
            <div className="flex items-center justify-between border-t pt-6 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (!canAddAnimal && !animalId)}
                className={`bg-gradient-to-r ${speciesInfo.color} text-white shadow-lg`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {animalId ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {animalId ? 'Update Animal' : 'Add Animal'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}