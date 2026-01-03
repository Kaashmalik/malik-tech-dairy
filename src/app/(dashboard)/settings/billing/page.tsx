'use client';

import { motion } from 'framer-motion';
import { CreditCard, ExternalLink, Receipt, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function BillingSettingsPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='container mx-auto space-y-6 py-6'
        >
            <div className='flex items-center gap-3'>
                <div className='rounded-xl bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400'>
                    <CreditCard className='h-6 w-6' />
                </div>
                <div>
                    <h1 className='text-3xl font-bold'>Billing & Subscription</h1>
                    <p className='text-muted-foreground'>Manage your plan, payments, and billing history</p>
                </div>
            </div>

            <div className='grid gap-6 max-w-4xl'>
                <Card className='border-emerald-500/20 bg-emerald-500/5'>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                            <ShieldCheck className='h-5 w-5 text-emerald-600' />
                            Active Management
                        </CardTitle>
                        <CardDescription>
                            All subscription and billing management has been moved to a dedicated section for better security.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className='bg-emerald-600 hover:bg-emerald-700'>
                            <Link href='/subscription' className='flex items-center gap-2'>
                                Go to Subscription Manager
                                <ExternalLink className='h-4 w-4' />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                            <Receipt className='h-5 w-5 text-gray-400' />
                            Billing History
                        </CardTitle>
                        <CardDescription>View and download your previous invoices</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='flex flex-col items-center justify-center py-8 text-center text-gray-500'>
                            <Receipt className='h-12 w-12 mb-3 opacity-20' />
                            <p>No billing history found for this farm yet.</p>
                            <p className='text-sm'>Invoices will appear here once your first payment is processed.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}
