'use client';

import { useState } from 'react';
import { useClerk, useOrganization } from '@clerk/nextjs';
import { Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DataPrivacySettingsPage() {
  const { organization } = useOrganization();
  const { setActive } = useClerk();
  const [exporting, setExporting] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const farmName = organization?.name || '';

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/tenant/export');
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Export failed');
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `farm-export-${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch('/api/tenant/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmFarmName: confirmName }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed');
      toast.success('Farm deleted');
      await setActive({ organization: null });
      window.location.href = '/select-farm';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className='container max-w-3xl space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Data & Privacy</h1>
        <p className='text-muted-foreground'>Your farm data belongs to you.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Download className='h-5 w-5' /> Export all farm data
          </CardTitle>
          <CardDescription>
            Download a ZIP with every record (animals, milk, health, breeding, finance, staff,
            tasks…) as JSON files. Owner only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? 'Preparing export…' : 'Download export'}
          </Button>
        </CardContent>
      </Card>

      <Card className='border-red-200 dark:border-red-900'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-red-600'>
            <Trash2 className='h-5 w-5' /> Delete this farm
          </CardTitle>
          <CardDescription>
            Closes the farm for all members immediately and cancels any paid plan. Download an
            export first. To recover a farm deleted by mistake, contact support within 30 days.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div>
            <Label htmlFor='confirm-farm'>
              Type <span className='font-semibold'>{farmName}</span> to confirm
            </Label>
            <Input
              id='confirm-farm'
              value={confirmName}
              onChange={e => setConfirmName(e.target.value)}
              autoComplete='off'
            />
          </div>
          <Button
            variant='destructive'
            disabled={
              deleting ||
              !farmName ||
              confirmName.trim().toLowerCase() !== farmName.trim().toLowerCase()
            }
            onClick={handleDelete}
          >
            {deleting ? 'Deleting…' : 'Delete farm permanently'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
