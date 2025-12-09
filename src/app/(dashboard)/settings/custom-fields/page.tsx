'use client';

import { CustomFieldsForm } from '@/components/custom-fields/CustomFieldsForm';

export default function CustomFieldsSettingsPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Custom Fields</h1>
        <p className='text-muted-foreground'>Define additional fields to track for your animals</p>
      </div>

      <CustomFieldsForm />
    </div>
  );
}
