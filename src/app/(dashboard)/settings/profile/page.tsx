'use client';

import { useOrganization } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Building2, Save, Globe, Phone, Mail, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function FarmProfileSettingsPage() {
    const { organization } = useOrganization();

    const handleSave = () => {
        toast.success('Farm profile updated successfully');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='container mx-auto space-y-6 py-6'
        >
            <div className='flex items-center gap-3'>
                <div className='rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400'>
                    <Building2 className='h-6 w-6' />
                </div>
                <div>
                    <h1 className='text-3xl font-bold'>Farm Profile</h1>
                    <p className='text-muted-foreground'>Manage your farm details and branding</p>
                </div>
            </div>

            <div className='grid gap-6 md:grid-cols-3'>
                <Card className='md:col-span-2'>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Update your farm's public information</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='grid gap-4 md:grid-cols-2'>
                            <div className='space-y-2'>
                                <Label htmlFor='farmName'>Farm Name</Label>
                                <Input id='farmName' defaultValue={organization?.name || ''} placeholder='Enter farm name' />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor='farmType'>Farm Type</Label>
                                <Input id='farmType' placeholder='e.g., Dairy, Poultry' defaultValue='Dairy Farm' />
                            </div>
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='description'>About the Farm</Label>
                            <Textarea id='description' placeholder='Describe your farm operations...' className='min-h-[100px]' />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Branding</CardTitle>
                        <CardDescription>Farm logo and theme</CardDescription>
                    </CardHeader>
                    <CardContent className='flex flex-col items-center justify-center space-y-4 py-8'>
                        <div className='h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-4xl text-white shadow-xl'>
                            {organization?.name?.charAt(0) || 'F'}
                        </div>
                        <Button variant='outline' size='sm'>Change Logo</Button>
                    </CardContent>
                </Card>

                <Card className='md:col-span-3'>
                    <CardHeader>
                        <CardTitle>Contact Details</CardTitle>
                        <CardDescription>How users can reach your farm office</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='grid gap-4 md:grid-cols-3'>
                            <div className='space-y-2'>
                                <Label htmlFor='phone'>Phone Number</Label>
                                <div className='relative'>
                                    <Phone className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                                    <Input id='phone' className='pl-10' placeholder='+92 XXX XXXXXXX' />
                                </div>
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor='email'>Email Address</Label>
                                <div className='relative'>
                                    <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                                    <Input id='email' className='pl-10' placeholder='farm@example.com' />
                                </div>
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor='website'>Website URL</Label>
                                <div className='relative'>
                                    <Globe className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                                    <Input id='website' className='pl-10' placeholder='https://myfarm.com' />
                                </div>
                            </div>
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='address'>Physical Address</Label>
                            <div className='relative'>
                                <MapPin className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                                <Textarea id='address' className='pl-10' placeholder='Full address of the farm headquarters' />
                            </div>
                        </div>
                        <div className='flex justify-end pt-4'>
                            <Button onClick={handleSave} className='gap-2'>
                                <Save className='h-4 w-4' />
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}
