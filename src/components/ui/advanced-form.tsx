'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Camera, Save, X, Upload, FileText } from 'lucide-react';

interface AdvancedFormProps {
  title: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
  className?: string;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'file' | 'image';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  validation?: (value: any) => string | null;
}

export function AdvancedForm({
  title,
  fields,
  onSubmit,
  initialData = {},
  className,
}: AdvancedFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (!value || value === '')) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      return field.validation(value);
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, ...uploadedFiles });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (fieldName: string, files: FileList | null) => {
    if (files) {
      setUploadedFiles(prev => ({
        ...prev,
        [fieldName]: Array.from(files),
      }));
    }
  };

  return (
    <Card className={cn('border-white/10 bg-white/5 backdrop-blur-xl', className)}>
      <CardHeader>
        <CardTitle className='text-white'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {fields.map(field => (
            <div key={field.name} className='space-y-2'>
              <Label htmlFor={field.name} className='text-sm text-white/80'>
                {field.label}
                {field.required && <span className='ml-1 text-red-400'>*</span>}
              </Label>

              {field.type === 'text' || field.type === 'number' || field.type === 'date' ? (
                <Input
                  id={field.name}
                  type={field.type}
                  value={formData[field.name] || ''}
                  onChange={e => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className='border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:bg-white/10'
                />
              ) : field.type === 'select' ? (
                <Select
                  value={formData[field.name] || ''}
                  onValueChange={value => handleFieldChange(field.name, value)}
                >
                  <SelectTrigger className='border-white/10 bg-white/5 text-white'>
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent className='border-white/10 bg-slate-900'>
                    {field.options?.map(option => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className='text-white hover:bg-white/10'
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  value={formData[field.name] || ''}
                  onChange={e => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className='min-h-[100px] border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:bg-white/10'
                />
              ) : field.type === 'file' ? (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Input
                      id={field.name}
                      type='file'
                      multiple
                      onChange={e => handleFileUpload(field.name, e.target.files)}
                      className='border-white/10 bg-white/5 text-white file:text-white/60'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='border-white/20 text-white hover:bg-white/10'
                    >
                      <Upload className='h-4 w-4' />
                    </Button>
                  </div>
                  {uploadedFiles[field.name]?.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between rounded border border-white/10 bg-white/5 p-2'
                    >
                      <span className='flex-1 truncate text-sm text-white/60'>{file.name}</span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setUploadedFiles(prev => ({
                            ...prev,
                            [field.name]: prev[field.name]?.filter((_, i) => i !== index),
                          }));
                        }}
                        className='text-red-400 hover:text-red-300'
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : field.type === 'image' ? (
                <div className='space-y-2'>
                  <div className='rounded-lg border-2 border-dashed border-white/20 p-6 text-center'>
                    <Camera className='mx-auto mb-2 h-12 w-12 text-white/40' />
                    <p className='mb-2 text-sm text-white/60'>
                      Drag and drop image or click to upload
                    </p>
                    <Input
                      id={field.name}
                      type='file'
                      accept='image/*'
                      onChange={e => handleFileUpload(field.name, e.target.files)}
                      className='mx-auto max-w-xs border-white/10 bg-white/5 text-white'
                    />
                  </div>
                  {uploadedFiles[field.name]?.map((file, index) => (
                    <div key={index} className='relative'>
                      <img
                        src={URL.createObjectURL(file)}
                        alt='Preview'
                        className='h-48 w-full rounded-lg object-cover'
                      />
                      <Button
                        type='button'
                        variant='destructive'
                        size='sm'
                        onClick={() => {
                          setUploadedFiles(prev => ({
                            ...prev,
                            [field.name]: prev[field.name]?.filter((_, i) => i !== index),
                          }));
                        }}
                        className='absolute right-2 top-2'
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              {errors[field.name] && <p className='text-sm text-red-400'>{errors[field.name]}</p>}
            </div>
          ))}

          <div className='flex gap-3 pt-4'>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 bg-blue-600 hover:bg-blue-700'
            >
              {isSubmitting ? (
                <div className='flex items-center gap-2'>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                  Saving...
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <Save className='h-4 w-4' />
                  Save
                </div>
              )}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setFormData(initialData);
                setErrors({});
                setUploadedFiles({});
              }}
              className='border-white/20 text-white hover:bg-white/10'
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Quick Action Button Component
export function QuickAction({
  icon,
  label,
  description,
  onClick,
  variant = 'primary',
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      onClick={onClick}
      className={cn('rounded-lg p-4 text-left transition-all duration-200', variantStyles[variant])}
    >
      <div className='flex items-start gap-3'>
        <div className='flex-shrink-0'>{icon}</div>
        <div>
          <h4 className='font-semibold'>{label}</h4>
          <p className='text-sm opacity-80'>{description}</p>
        </div>
      </div>
    </button>
  );
}

// Empty State Component
export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className='flex flex-col items-center justify-center py-12 text-center'>
      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10'>
        {icon}
      </div>
      <h3 className='mb-2 text-lg font-semibold text-white'>{title}</h3>
      <p className='mb-6 max-w-sm text-white/60'>{description}</p>
      {action && actionLabel && (
        <Button onClick={action} className='bg-blue-600 hover:bg-blue-700'>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Pull to Refresh Component
export function PullToRefresh({
  onRefresh,
  isRefreshing,
  children,
}: {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  children: React.ReactNode;
}) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
    const distance = e.targetTouches[0].clientY - touchStart;
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, 120));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 80 && !isRefreshing) {
      await onRefresh();
    }
    setPullDistance(0);
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div
      className='relative'
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className='absolute left-0 right-0 top-0 flex items-center justify-center bg-white/5 backdrop-blur-xl transition-transform duration-200'
        style={{
          transform: `translateY(${Math.min(pullDistance - 120, 0)}px)`,
          height: `${Math.max(pullDistance, 0)}px`,
        }}
      >
        {isRefreshing ? (
          <div className='flex items-center gap-2 text-white/60'>
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
            Refreshing...
          </div>
        ) : (
          <div className='text-white/60'>
            {pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
