'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Save, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function NotificationsSettingsPage() {
    const [prefs, setPrefs] = useState({
        email: true,
        push: false,
        sms: false,
        lowStock: true,
        healthAlerts: true,
        milkReminders: true,
    });

    const handleSave = () => {
        toast.success('Notification preferences saved');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='container mx-auto space-y-6 py-6'
        >
            <div className='flex items-center gap-3'>
                <div className='rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400'>
                    <Bell className='h-6 w-6' />
                </div>
                <div>
                    <h1 className='text-3xl font-bold'>Notifications</h1>
                    <p className='text-muted-foreground'>Choose how and when you want to be notified</p>
                </div>
            </div>

            <div className='grid gap-6 max-w-4xl'>
                <Card>
                    <CardHeader>
                        <CardTitle>Delivery Methods</CardTitle>
                        <CardDescription>Select your preferred communication channels</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                                <div className='rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30'>
                                    <Mail className='h-4 w-4' />
                                </div>
                                <div>
                                    <Label className='text-base'>Email Notifications</Label>
                                    <p className='text-sm text-gray-500'>Receive detailed reports and alerts via email</p>
                                </div>
                            </div>
                            <Switch checked={prefs.email} onCheckedChange={(v) => setPrefs({ ...prefs, email: v })} />
                        </div>

                        <Separator />

                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                                <div className='rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30'>
                                    <Smartphone className='h-4 w-4' />
                                </div>
                                <div>
                                    <Label className='text-base'>Push Notifications</Label>
                                    <p className='text-sm text-gray-500'>Get instant alerts on your mobile or desktop</p>
                                </div>
                            </div>
                            <Switch checked={prefs.push} onCheckedChange={(v) => setPrefs({ ...prefs, push: v })} />
                        </div>

                        <Separator />

                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                                <div className='rounded-full bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30'>
                                    <MessageSquare className='h-4 w-4' />
                                </div>
                                <div>
                                    <Label className='text-base'>SMS Alerts</Label>
                                    <p className='text-sm text-gray-500'>Crucial emergency alerts via Text Message</p>
                                </div>
                            </div>
                            <Switch checked={prefs.sms} onCheckedChange={(v) => setPrefs({ ...prefs, sms: v })} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Alert Types</CardTitle>
                        <CardDescription>Customize which events trigger notifications</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <Label className='text-base'>Health Alerts</Label>
                                <p className='text-sm text-gray-500'>Notify when an animal needs urgent medical attention</p>
                            </div>
                            <Switch checked={prefs.healthAlerts} onCheckedChange={(v) => setPrefs({ ...prefs, healthAlerts: v })} />
                        </div>

                        <Separator />

                        <div className='flex items-center justify-between'>
                            <div>
                                <Label className='text-base'>Low Stock Warnings</Label>
                                <p className='text-sm text-gray-500'>Alert when medicine or feed levels are below threshold</p>
                            </div>
                            <Switch checked={prefs.lowStock} onCheckedChange={(v) => setPrefs({ ...prefs, lowStock: v })} />
                        </div>

                        <Separator />

                        <div className='flex items-center justify-between'>
                            <div>
                                <Label className='text-base'>Milking Reminders</Label>
                                <p className='text-sm text-gray-500'>Daily reminders for morning and evening milking</p>
                            </div>
                            <Switch checked={prefs.milkReminders} onCheckedChange={(v) => setPrefs({ ...prefs, milkReminders: v })} />
                        </div>
                    </CardContent>
                    <CardHeader className='pt-0'>
                        <div className='flex justify-end'>
                            <Button onClick={handleSave} className='gap-2'>
                                <Save className='h-4 w-4' />
                                Save Preferences
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        </motion.div>
    );
}
