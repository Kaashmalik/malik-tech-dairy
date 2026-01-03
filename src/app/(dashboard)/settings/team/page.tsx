'use client';

import { useOrganization, useOrganizationList } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Users, UserPlus, Shield, Mail, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function TeamSettingsPage() {
    const { organization } = useOrganization();

    // Placeholder for team members since fetching depends on clerk setup
    const members = [
        {
            id: '1',
            name: 'Farm Owner',
            email: 'owner@mtkdairy.com',
            role: 'Admin',
            status: 'active',
            avatar: '',
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='container mx-auto space-y-6 py-6'
        >
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div className='flex items-center gap-3'>
                    <div className='rounded-xl bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400'>
                        <Users className='h-6 w-6' />
                    </div>
                    <div>
                        <h1 className='text-3xl font-bold'>Team Management</h1>
                        <p className='text-muted-foreground'>Manage your farm staff and their access levels</p>
                    </div>
                </div>
                <Button className='gap-2'>
                    <UserPlus className='h-4 w-4' />
                    Invite Member
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Organization Members</CardTitle>
                    <CardDescription>
                        Manage the people who have access to <strong>{organization?.name || 'this farm'}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='space-y-4'>
                        {members.map((member) => (
                            <div key={member.id} className='flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors'>
                                <div className='flex items-center gap-4'>
                                    <Avatar>
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback className='bg-indigo-100 text-indigo-700 font-bold'>
                                            {member.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className='font-semibold'>{member.name}</p>
                                        <div className='flex items-center gap-2 text-sm text-gray-500'>
                                            <Mail className='h-3 w-3' />
                                            {member.email}
                                        </div>
                                    </div>
                                </div>
                                <div className='flex items-center gap-4'>
                                    <div className='hidden md:flex flex-col items-end'>
                                        <Badge variant='secondary' className='bg-indigo-50 text-indigo-700 border-indigo-100'>
                                            <Shield className='h-3 w-3 mr-1' />
                                            {member.role}
                                        </Badge>
                                    </div>
                                    <Button variant='ghost' size='sm'>
                                        <MoreVertical className='h-4 w-4' />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className='mt-8 rounded-lg bg-indigo-50/50 p-6 border border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30'>
                        <div className='flex items-start gap-4'>
                            <Shield className='h-6 w-6 text-indigo-600 mt-1' />
                            <div>
                                <h4 className='font-bold text-indigo-900 dark:text-indigo-400'>Unified Access Control</h4>
                                <p className='text-sm text-indigo-800/80 dark:text-indigo-300/80 mt-1'>
                                    We use Clerk for secure identity management. You can also manage detailed permissions and roles via our specialized staff management module.
                                </p>
                                <Button variant='link' className='text-indigo-600 p-0 h-auto mt-2 text-sm'>
                                    Learn more about roles & permissions
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
