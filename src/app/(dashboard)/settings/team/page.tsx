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
    },
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
            Manage the people who have access to{' '}
            <strong>{organization?.name || 'this farm'}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {members.map(member => (
              <div
                key={member.id}
                className='flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50'
              >
                <div className='flex items-center gap-4'>
                  <Avatar>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className='bg-indigo-100 font-bold text-indigo-700'>
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
                  <div className='hidden flex-col items-end md:flex'>
                    <Badge
                      variant='secondary'
                      className='border-indigo-100 bg-indigo-50 text-indigo-700'
                    >
                      <Shield className='mr-1 h-3 w-3' />
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

          <div className='mt-8 rounded-lg border border-indigo-100 bg-indigo-50/50 p-6 dark:border-indigo-900/30 dark:bg-indigo-900/10'>
            <div className='flex items-start gap-4'>
              <Shield className='mt-1 h-6 w-6 text-indigo-600' />
              <div>
                <h4 className='font-bold text-indigo-900 dark:text-indigo-400'>
                  Unified Access Control
                </h4>
                <p className='mt-1 text-sm text-indigo-800/80 dark:text-indigo-300/80'>
                  We use Clerk for secure identity management. You can also manage detailed
                  permissions and roles via our specialized staff management module.
                </p>
                <Button variant='link' className='mt-2 h-auto p-0 text-sm text-indigo-600'>
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
