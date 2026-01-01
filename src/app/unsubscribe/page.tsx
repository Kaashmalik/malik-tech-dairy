/**
 * Unsubscribe Page
 * Allows users to unsubscribe from emails via token
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, Mail, Settings } from 'lucide-react';
import { toast } from 'sonner';

function UnsubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('Invalid unsubscribe link');
      setLoading(false);
      return;
    }

    unsubscribe(token);
  }, [searchParams]);

  const unsubscribe = async (token: string) => {
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setSuccess(true);
        toast.success('Successfully unsubscribed from all emails');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to unsubscribe');
      }
    } catch (err) {
      setError('An error occurred while processing your request');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4'>
        <Card className='w-full max-w-md'>
          <CardContent className='pt-6'>
            <div className='flex flex-col items-center space-y-4'>
              <Loader2 className='text-primary h-8 w-8 animate-spin' />
              <p className='text-muted-foreground text-sm'>Processing your request...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <AlertCircle className='mx-auto mb-4 h-12 w-12 text-red-500' />
            <CardTitle className='text-red-900'>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 text-center'>
            <Button onClick={() => router.push('/')} variant='outline'>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success && !showPreferences) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CheckCircle className='mx-auto mb-4 h-12 w-12 text-green-500' />
            <CardTitle className='text-green-900'>Unsubscribed</CardTitle>
            <CardDescription>
              You have been successfully unsubscribed from all email notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='text-muted-foreground space-y-2 text-sm'>
              <p>If you unsubscribed by mistake, you can:</p>
              <ul className='ml-2 list-inside list-disc space-y-1'>
                <li>Log in to your account to manage email preferences</li>
                <li>Contact support for assistance</li>
              </ul>
            </div>
            <div className='flex flex-col gap-2'>
              <Button onClick={() => router.push('/sign-in')} className='w-full'>
                Sign In to Manage Preferences
              </Button>
              <Button onClick={() => router.push('/')} variant='outline' className='w-full'>
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 px-4 py-12'>
      <div className='mx-auto max-w-2xl'>
        <Card>
          <CardHeader className='text-center'>
            <Mail className='text-primary mx-auto mb-4 h-12 w-12' />
            <CardTitle>Email Preferences</CardTitle>
            <CardDescription>Manage your email notification settings</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='bg-muted rounded-lg p-4'>
              <p className='text-muted-foreground text-sm'>
                Sign in to your account to fully customize your email preferences or contact support
                at support@maliktechdairy.com for assistance.
              </p>
            </div>

            <div className='flex flex-col gap-2'>
              <Button onClick={() => router.push('/sign-in')}>
                <Settings className='mr-2 h-4 w-4' />
                Sign In to Manage Preferences
              </Button>
              <Button onClick={() => router.push('/')} variant='outline'>
                Return to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4'>
          <Card className='w-full max-w-md'>
            <CardContent className='pt-6'>
              <div className='flex flex-col items-center space-y-4'>
                <Loader2 className='text-primary h-8 w-8 animate-spin' />
                <p className='text-muted-foreground text-sm'>Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
