/**
 * Unsubscribe Page
 * Allows users to unsubscribe from emails via token
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, Mail, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function UnsubscribePage() {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing your request...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-900">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={() => router.push('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success && !showPreferences) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-900">Unsubscribed</CardTitle>
            <CardDescription>
              You have been successfully unsubscribed from all email notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>If you unsubscribed by mistake, you can:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Log in to your account to manage email preferences</li>
                <li>Contact support for assistance</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push('/sign-in')} className="w-full">
                Sign In to Manage Preferences
              </Button>
              <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Email Preferences</CardTitle>
            <CardDescription>
              Manage your email notification settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Sign in to your account to fully customize your email preferences or 
                contact support at support@maliktechdairy.com for assistance.
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push('/sign-in')}>
                <Settings className="h-4 w-4 mr-2" />
                Sign In to Manage Preferences
              </Button>
              <Button onClick={() => router.push('/')} variant="outline">
                Return to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
