'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
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
import { Badge } from '@/components/ui/badge';
import {
    Stethoscope,
    AlertCircle,
    Calendar,
    User,
    DollarSign,
    CheckCircle,
    XCircle,
    HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { PREGNANCY_CHECK_METHODS, PREGNANCY_CHECK_RESULTS } from '@/lib/breeding-constants';
import type { PregnancyCheckMethod, PregnancyCheckResult } from '@/types';

interface PregnancyCheckFormProps {
    breedingRecordId: string;
    animalId: string;
    animalName: string;
    recommendedMethod?: PregnancyCheckMethod;
    onClose: () => void;
    onSuccess: () => void;
}

interface PregnancyCheckFormData {
    checkDate: string;
    checkMethod: PregnancyCheckMethod;
    result: PregnancyCheckResult;
    vetName?: string;
    cost?: string;
    notes?: string;
}

export function PregnancyCheckForm({
    breedingRecordId,
    animalId,
    animalName,
    recommendedMethod,
    onClose,
    onSuccess,
}: PregnancyCheckFormProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<PregnancyCheckFormData>({
        defaultValues: {
            checkDate: format(new Date(), 'yyyy-MM-dd'),
            checkMethod: recommendedMethod || 'ultrasound',
            result: 'positive',
            vetName: '',
            cost: '',
            notes: '',
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: PregnancyCheckFormData) => {
            const res = await fetch('/api/breeding/pregnancy-checks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    breedingRecordId,
                    animalId,
                    checkDate: data.checkDate,
                    checkMethod: data.checkMethod,
                    result: data.result,
                    vetName: data.vetName || undefined,
                    cost: data.cost ? parseFloat(data.cost) : undefined,
                    notes: data.notes || undefined,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to save pregnancy check');
            }

            return res.json();
        },
        onSuccess: () => {
            onSuccess();
        },
    });

    const onSubmit = (data: PregnancyCheckFormData) => {
        mutation.mutate(data);
    };

    const selectedResult = watch('result');
    const selectedMethod = watch('checkMethod');

    const getResultIcon = (result: PregnancyCheckResult) => {
        switch (result) {
            case 'positive':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'negative':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'inconclusive':
                return <HelpCircle className="h-5 w-5 text-yellow-500" />;
        }
    };

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Record Pregnancy Check
                </CardTitle>
                <CardDescription className="text-blue-50">
                    Recording check for: <strong>{animalName}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Check Date */}
                    <div className="space-y-2">
                        <Label htmlFor="checkDate" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Check Date *
                        </Label>
                        <Input
                            id="checkDate"
                            type="date"
                            {...register('checkDate', { required: true })}
                            className="dark:bg-slate-950"
                        />
                        {errors.checkDate && (
                            <p className="text-sm text-red-500">Check date is required</p>
                        )}
                    </div>

                    {/* Check Method */}
                    <div className="space-y-2">
                        <Label htmlFor="checkMethod">Check Method *</Label>
                        <Select
                            value={watch('checkMethod')}
                            onValueChange={(value) => setValue('checkMethod', value as PregnancyCheckMethod)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                {PREGNANCY_CHECK_METHODS.map((method) => (
                                    <SelectItem key={method.value} value={method.value}>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span>{method.label}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {method.accuracy}
                                                </Badge>
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {/* Method description */}
                        <p className="text-xs text-muted-foreground">
                            {PREGNANCY_CHECK_METHODS.find((m) => m.value === selectedMethod)?.description}
                        </p>
                    </div>

                    {/* Result */}
                    <div className="space-y-2">
                        <Label>Result *</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {PREGNANCY_CHECK_RESULTS.map((resultOption) => (
                                <button
                                    key={resultOption.value}
                                    type="button"
                                    onClick={() => setValue('result', resultOption.value)}
                                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${selectedResult === resultOption.value
                                            ? resultOption.value === 'positive'
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : resultOption.value === 'negative'
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                    : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {getResultIcon(resultOption.value)}
                                    <span className="font-medium text-sm">{resultOption.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Result message */}
                    {selectedResult && (
                        <div
                            className={`p-3 rounded-lg ${selectedResult === 'positive'
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                    : selectedResult === 'negative'
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                        : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                                }`}
                        >
                            <p className="text-sm">
                                {selectedResult === 'positive'
                                    ? '✨ Great news! The breeding record will be marked as "Pregnant".'
                                    : selectedResult === 'negative'
                                        ? 'The breeding record will be marked as "Not Pregnant". Consider re-breeding.'
                                        : 'Consider scheduling a follow-up check in 7-14 days.'}
                            </p>
                        </div>
                    )}

                    {/* Veterinarian */}
                    <div className="space-y-2">
                        <Label htmlFor="vetName" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Veterinarian Name
                        </Label>
                        <Input
                            id="vetName"
                            {...register('vetName')}
                            placeholder="Dr. Name"
                            className="dark:bg-slate-950"
                        />
                    </div>

                    {/* Cost */}
                    <div className="space-y-2">
                        <Label htmlFor="cost" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Cost (PKR)
                        </Label>
                        <Input
                            id="cost"
                            type="number"
                            {...register('cost')}
                            placeholder="0"
                            className="dark:bg-slate-950"
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            {...register('notes')}
                            placeholder="Additional observations, fetal development notes..."
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
                            className={`${selectedResult === 'positive'
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                                    : selectedResult === 'negative'
                                        ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
                                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                                }`}
                        >
                            {mutation.isPending ? 'Saving...' : 'Record Check Result'}
                        </Button>
                    </div>

                    {/* Error Display */}
                    {mutation.isError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                {mutation.error?.message || 'Failed to save pregnancy check'}
                            </p>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
