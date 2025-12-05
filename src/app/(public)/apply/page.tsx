// Farm Application Page - Users apply for Farm ID here
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  PawPrint,
  CreditCard,
  Upload,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  FileImage,
  X,
  Copy,
  Check,
  Smartphone,
  Landmark,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
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
import { toast } from 'sonner';

const applicationSchema = z.object({
  farmName: z.string().min(2, 'Farm name must be at least 2 characters'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  animalTypes: z.array(z.string()).min(1, 'Select at least one animal type'),
  estimatedAnimals: z.number().int().positive('Must be a positive number'),
  requestedPlan: z.enum(['free', 'professional', 'farm', 'enterprise']).nullable(),
  paymentSlipUrl: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const animalTypeOptions = [
  { value: 'cow', label: '🐄 Cows' },
  { value: 'buffalo', label: '🐃 Buffaloes' },
  { value: 'goat', label: '🐐 Goats' },
  { value: 'sheep', label: '🐑 Sheep' },
  { value: 'chicken', label: '🐔 Chickens' },
  { value: 'horse', label: '🐴 Horses' },
];

const planOptions = [
  { 
    value: 'free', 
    label: 'Free', 
    price: 'Rs. 0/mo', 
    features: ['Up to 5 animals', '1 user', 'Basic features'],
  },
  { 
    value: 'professional', 
    label: 'Professional', 
    price: 'Rs. 4,999/mo', 
    features: ['Up to 100 animals', '5 users', 'Full analytics', 'Health records'],
  },
  { 
    value: 'farm', 
    label: 'Farm', 
    price: 'Rs. 12,999/mo', 
    features: ['Up to 500 animals', '15 users', 'IoT integration', 'API access'],
  },
  { 
    value: 'enterprise', 
    label: 'Enterprise', 
    price: 'Custom', 
    features: ['Unlimited', 'Unlimited users', 'White-label', 'Dedicated support'],
  },
];

const provinces = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Gilgit-Baltistan',
  'Azad Kashmir',
  'Islamabad Capital Territory',
];

// Payment methods
const paymentMethods = {
  bank: {
    name: 'Meezan Bank',
    accountName: 'MUHAMMAD KASHIF',
    accountNumber: '11330109676650',
    iban: 'PK26MEZN0011330109676650',
    branch: 'BHUBTIAN BRANCH LHR',
  },
  jazzcash: {
    name: 'JazzCash',
    accountName: 'Muhammad Kashif',
    accountNumber: '03020718182',
  },
};

// User status type
interface UserStatus {
  hasFarms: boolean;
  pendingApplications: number;
  farms: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
  applications: Array<{
    id: string;
    farmName: string;
    status: string;
    assignedFarmId?: string;
    createdAt: string;
  }>;
}

export default function ApplyForFarmPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnimalTypes, setSelectedAnimalTypes] = useState<string[]>([]);
  const [paymentSlipFile, setPaymentSlipFile] = useState<File | null>(null);
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string>('');
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bank' | 'jazzcash'>('bank');
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // User status state
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      farmName: '',
      ownerName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      province: 'Punjab',
      animalTypes: [],
      estimatedAnimals: 1,
      requestedPlan: null, // No default - user must explicitly select
    },
    mode: 'onChange',
  });

  // Check user status on load
  useEffect(() => {
    async function checkUserStatus() {
      if (!isLoaded || !user) {
        setCheckingStatus(false);
        return;
      }

      try {
        const response = await fetch('/api/user/farms');
        const data = await response.json();
        
        if (data.success) {
          setUserStatus(data.data);
          
          // If user has farms, redirect to select-farm (which will redirect to dashboard if org is active)
          if (data.data.hasFarms && data.data.farms.length > 0) {
            router.push('/select-farm');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      } finally {
        setCheckingStatus(false);
      }
    }

    checkUserStatus();
  }, [isLoaded, user, router]);

  // Set user data when loaded
  useEffect(() => {
    if (isLoaded && user) {
      setValue('ownerName', user.fullName || '');
      setValue('email', user.primaryEmailAddress?.emailAddress || '');
    }
  }, [isLoaded, user, setValue]);

  const requestedPlan = watch('requestedPlan');
  const farmName = watch('farmName');
  const ownerName = watch('ownerName');
  const email = watch('email');
  const phone = watch('phone');
  const estimatedAnimals = watch('estimatedAnimals');
  const isPlanSelected = requestedPlan !== null && requestedPlan !== undefined;
  const isPaidPlan = isPlanSelected && requestedPlan !== 'free';
  const totalSteps = isPaidPlan ? 4 : 3;

  // Step validation
  const validateStep = async (currentStep: number): Promise<boolean> => {
    setStepErrors([]);
    const errors: string[] = [];

    if (currentStep === 1) {
      if (!farmName || farmName.length < 2) errors.push('Farm name is required (min 2 characters)');
      if (!ownerName || ownerName.length < 2) errors.push('Owner name is required (min 2 characters)');
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
      if (!phone || phone.length < 10) errors.push('Phone number is required (min 10 digits)');
    }

    if (currentStep === 2) {
      if (selectedAnimalTypes.length === 0) errors.push('Select at least one animal type');
      if (!estimatedAnimals || estimatedAnimals < 1) errors.push('Estimated animals must be at least 1');
    }

    if (currentStep === 3) {
      if (!requestedPlan) errors.push('Please select a plan before continuing');
    }

    if (errors.length > 0) {
      setStepErrors(errors);
      toast.error(errors[0]);
      return false;
    }

    return true;
  };

  const handleNextStep = async () => {
    const isValid = await validateStep(step);
    if (isValid) {
      setStep(step + 1);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle payment slip upload
  const handlePaymentSlipUpload = async (file: File) => {
    setUploadingSlip(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'payment-slip');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.url) {
        setPaymentSlipUrl(result.url);
        setValue('paymentSlipUrl', result.url);
        toast.success('Payment slip uploaded successfully!');
      } else {
        toast.error(result.error || 'Failed to upload payment slip');
      }
    } catch (error) {
      toast.error('Failed to upload payment slip');
    } finally {
      setUploadingSlip(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setPaymentSlipFile(file);
      handlePaymentSlipUpload(file);
    }
  };

  async function onSubmit(data: ApplicationFormData) {
    // Validate plan is selected
    if (!data.requestedPlan) {
      toast.error('Please select a plan before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        ...data,
        requestedPlan: data.requestedPlan, // Ensure plan is included
        paymentSlipUrl: paymentSlipUrl || undefined,
      };

      const response = await fetch('/api/farm-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Application submitted successfully!');
        router.push(`/apply/success?id=${result.data.id}`);
      } else {
        toast.error(result.error || 'Failed to submit application');
      }
    } catch (error) {
      toast.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  }

  function toggleAnimalType(type: string) {
    const newTypes = selectedAnimalTypes.includes(type)
      ? selectedAnimalTypes.filter(t => t !== type)
      : [...selectedAnimalTypes, type];
    
    setSelectedAnimalTypes(newTypes);
    setValue('animalTypes', newTypes);
    setStepErrors([]);
  }

  // Show loading state while checking user status
  if (checkingStatus || !isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-slate-400">Checking your status...</p>
        </div>
      </div>
    );
  }

  // Show existing applications if user has any
  const existingApplication = userStatus?.applications?.find(
    app => app.status === 'pending' || app.status === 'payment_uploaded' || app.status === 'approved'
  );

  if (existingApplication) {
    const statusInfo: Record<string, { color: string; bg: string; label: string; message: string }> = {
      pending: {
        color: 'text-amber-600',
        bg: 'bg-amber-50 border-amber-200',
        label: 'Pending Review',
        message: 'Your application is being reviewed by our team. We\'ll notify you once it\'s processed.'
      },
      payment_uploaded: {
        color: 'text-blue-600',
        bg: 'bg-blue-50 border-blue-200',
        label: 'Payment Under Review',
        message: 'Your payment slip has been uploaded and is being verified. We\'ll approve your farm shortly.'
      },
      approved: {
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 border-emerald-200',
        label: 'Approved',
        message: 'Congratulations! Your farm has been approved. Click below to access your dashboard.'
      }
    };

    const info = statusInfo[existingApplication.status] || statusInfo.pending;

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
            <div className={`w-20 h-20 ${existingApplication.status === 'approved' ? 'bg-emerald-100' : 'bg-amber-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
              {existingApplication.status === 'approved' ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              ) : (
                <AlertCircle className="w-10 h-10 text-amber-600" />
              )}
            </div>

            <h1 className="text-2xl font-bold dark:text-white mb-2">
              {existingApplication.status === 'approved' ? 'Welcome to MTK Dairy!' : 'Application Submitted'}
            </h1>
            
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              {info.message}
            </p>

            <div className={`${info.bg} border rounded-xl p-4 mb-6`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Farm Name</span>
                <span className="font-medium dark:text-white">{existingApplication.farmName}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`font-medium ${info.color}`}>{info.label}</span>
              </div>
              {existingApplication.assignedFarmId && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-500">Farm ID</span>
                  <span className="font-mono font-bold text-emerald-600">{existingApplication.assignedFarmId}</span>
                </div>
              )}
            </div>

            {existingApplication.status === 'approved' ? (
              <Button
                onClick={() => router.push('/select-farm')}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <p className="text-sm text-gray-500">
                Questions? Contact us at <a href="mailto:support@maliktechdairy.com" className="text-emerald-600 hover:underline">support@maliktechdairy.com</a>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 animate-bounce-slow">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Apply for Farm ID
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Register your farm and get started with MTK Dairy
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step >= s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-500'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < totalSteps && (
                <div
                  className={`w-8 md:w-12 h-1 mx-1 transition-all ${
                    step > s ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
            {/* Step 1: Farm Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  Farm Details
                </h2>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="farmName">Farm Name *</Label>
                    <Input
                      id="farmName"
                      {...register('farmName')}
                      placeholder="e.g., Green Valley Dairy Farm"
                    />
                    {errors.farmName && (
                      <p className="text-sm text-red-500 mt-1">{errors.farmName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ownerName">Owner Name *</Label>
                      <Input
                        id="ownerName"
                        {...register('ownerName')}
                        placeholder="Full name"
                      />
                      {errors.ownerName && (
                        <p className="text-sm text-red-500 mt-1">{errors.ownerName.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="03XX-XXXXXXX"
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Farm Address</Label>
                    <Input
                      id="address"
                      {...register('address')}
                      placeholder="Full address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        {...register('city')}
                        placeholder="City name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Province</Label>
                      <Select
                        defaultValue="Punjab"
                        onValueChange={(value) => setValue('province', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Farm Setup */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                  <PawPrint className="w-5 h-5 text-emerald-600" />
                  Farm Setup
                </h2>

                <div>
                  <Label>Animal Types *</Label>
                  <p className="text-sm text-gray-500 mb-3">Select the types of animals on your farm</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {animalTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleAnimalType(option.value)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selectedAnimalTypes.includes(option.value)
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{option.label.split(' ')[0]}</span>
                        <p className="text-sm font-medium mt-1 dark:text-white">
                          {option.label.split(' ')[1]}
                        </p>
                      </button>
                    ))}
                  </div>
                  {errors.animalTypes && (
                    <p className="text-sm text-red-500 mt-2">{errors.animalTypes.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="estimatedAnimals">Estimated Number of Animals *</Label>
                  <Input
                    id="estimatedAnimals"
                    type="number"
                    {...register('estimatedAnimals', { valueAsNumber: true })}
                    min={1}
                    placeholder="e.g., 50"
                  />
                  {errors.estimatedAnimals && (
                    <p className="text-sm text-red-500 mt-1">{errors.estimatedAnimals.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Select Plan */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Select Your Plan
                </h2>

                {/* Info message */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-800 dark:text-blue-200 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Please select a plan to continue. You can upgrade or downgrade later.</span>
                  </p>
                </div>

                <div className="space-y-3">
                  {planOptions.map((plan) => (
                    <button
                      key={plan.value}
                      type="button"
                      onClick={() => {
                        setValue('requestedPlan', plan.value as ApplicationFormData['requestedPlan']);
                        setStepErrors([]);
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        requestedPlan === plan.value
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-200'
                          : 'border-gray-200 dark:border-slate-600 hover:border-emerald-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold dark:text-white">{plan.label}</p>
                          <p className={`font-bold ${plan.value === 'free' ? 'text-green-600' : 'text-emerald-600'}`}>
                            {plan.price}
                          </p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          requestedPlan === plan.value
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-gray-300 dark:border-slate-500'
                        }`}>
                          {requestedPlan === plan.value && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {plan.features.map((f, i) => (
                          <li key={i} className="text-sm text-gray-500 dark:text-slate-400">
                            • {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>

                {/* Show info based on selection */}
                {isPlanSelected && isPaidPlan && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-fade-in">
                    <p className="text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Next step: Upload payment slip to complete your application</span>
                    </p>
                  </div>
                )}

                {isPlanSelected && !isPaidPlan && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 animate-fade-in">
                    <p className="text-green-800 dark:text-green-200 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Free plan selected! Click Submit to complete your application.</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Payment Upload (for paid plans) */}
            {step === 4 && isPaidPlan && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  Payment & Upload Slip
                </h2>

                {/* Plan Summary */}
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
                  <p className="text-sm text-gray-500 dark:text-slate-400">Selected Plan</p>
                  <p className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    {planOptions.find(p => p.value === requestedPlan)?.label} - {planOptions.find(p => p.value === requestedPlan)?.price}
                  </p>
                </div>

                {/* Payment Method Tabs */}
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-700 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('bank')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                      selectedPaymentMethod === 'bank'
                        ? 'bg-white dark:bg-slate-600 shadow-md text-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Landmark className="w-5 h-5" />
                    Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('jazzcash')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                      selectedPaymentMethod === 'jazzcash'
                        ? 'bg-white dark:bg-slate-600 shadow-md text-red-500'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    JazzCash
                  </button>
                </div>

                {/* Bank Details */}
                {selectedPaymentMethod === 'bank' && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800 animate-fade-in">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                        <Landmark className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-green-800 dark:text-green-200">
                          {paymentMethods.bank.name}
                        </h3>
                        <p className="text-sm text-green-600">Bank Transfer</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Account Title', value: paymentMethods.bank.accountName, key: 'bank-name' },
                        { label: 'Account Number', value: paymentMethods.bank.accountNumber, key: 'bank-number' },
                        { label: 'IBAN', value: paymentMethods.bank.iban, key: 'bank-iban' },
                        { label: 'Branch', value: paymentMethods.bank.branch, key: 'bank-branch' },
                      ].map((item) => (
                        <div key={item.key} className="flex justify-between items-center py-2 px-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                          <div>
                            <p className="text-xs text-green-600 dark:text-green-400">{item.label}</p>
                            <p className="font-semibold text-green-900 dark:text-green-100">{item.value}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(item.value, item.key)}
                            className="text-green-600 hover:text-green-800 hover:bg-green-100"
                          >
                            {copiedField === item.key ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* JazzCash Details */}
                {selectedPaymentMethod === 'jazzcash' && (
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-red-200 dark:border-red-800 animate-fade-in">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-red-800 dark:text-red-200">
                          {paymentMethods.jazzcash.name}
                        </h3>
                        <p className="text-sm text-red-600">Mobile Wallet</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Account Name', value: paymentMethods.jazzcash.accountName, key: 'jazz-name' },
                        { label: 'Mobile Number', value: paymentMethods.jazzcash.accountNumber, key: 'jazz-number' },
                      ].map((item) => (
                        <div key={item.key} className="flex justify-between items-center py-2 px-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                          <div>
                            <p className="text-xs text-red-600 dark:text-red-400">{item.label}</p>
                            <p className="font-semibold text-red-900 dark:text-red-100">{item.value}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(item.value, item.key)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-100"
                          >
                            {copiedField === item.key ? (
                              <Check className="w-4 h-4 text-red-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Section */}
                <div>
                  <Label>Upload Payment Slip</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Upload a screenshot or photo of your bank transfer receipt
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {!paymentSlipUrl ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingSlip}
                      className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl hover:border-emerald-500 transition-colors flex flex-col items-center justify-center gap-3"
                    >
                      {uploadingSlip ? (
                        <>
                          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                          <p className="text-gray-500">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <FileImage className="w-8 h-8 text-gray-400" />
                          <p className="text-gray-500 dark:text-slate-400">
                            Click to upload payment slip
                          </p>
                          <p className="text-xs text-gray-400">
                            JPG, PNG or PDF (max 5MB)
                          </p>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        <div>
                          <p className="font-medium text-emerald-800 dark:text-emerald-200">
                            Payment slip uploaded!
                          </p>
                          <p className="text-sm text-emerald-600">
                            {paymentSlipFile?.name || 'File uploaded'}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPaymentSlipUrl('');
                          setPaymentSlipFile(null);
                          setValue('paymentSlipUrl', '');
                        }}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-amber-800 dark:text-amber-200 text-sm">
                    <strong>Note:</strong> You can submit without uploading now and upload the payment slip later from your dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Step Errors */}
            {stepErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 animate-shake">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">Please fix the following:</p>
                    <ul className="mt-1 space-y-1">
                      {stepErrors.map((error, i) => (
                        <li key={i} className="text-sm text-red-600 dark:text-red-300">• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStepErrors([]);
                    setStep(step - 1);
                  }}
                  className="group"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {/* Step 3 with paid plan - go to step 4 */}
              {step === 3 && isPlanSelected && isPaidPlan ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 group"
                >
                  Continue to Payment
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : step < 3 ? (
                /* Steps 1 and 2 - Next button */
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 group"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                /* Step 3 with free plan OR Step 4 - Submit button */
                <Button
                  type="submit"
                  disabled={submitting || !isPlanSelected}
                  onClick={async (e) => {
                    if (!isPlanSelected) {
                      e.preventDefault();
                      toast.error('Please select a plan before submitting');
                      setStepErrors(['Please select a plan to continue']);
                      return;
                    }
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : !isPlanSelected ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Select a Plan First
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {isPaidPlan && !paymentSlipUrl ? 'Submit (Upload Later)' : 'Submit Application'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
