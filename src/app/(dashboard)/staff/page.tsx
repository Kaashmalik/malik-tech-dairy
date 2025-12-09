'use client';

import { useState, useEffect } from 'react';
import { useTenantContext } from '@/components/tenant/TenantProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TenantRole, ROLE_DISPLAY_NAMES } from '@/types/roles';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface TeamMember {
  id: string;
  email: string;
  role: TenantRole;
  status: 'active' | 'invited' | 'suspended';
  joinedAt?: Date;
  invitedBy?: string;
}

export default function TeamManagementPage() {
  const { tenantId } = useTenantContext();
  const { hasPermission, isOwner, isManager } = usePermissions();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TenantRole>(TenantRole.MILKING_STAFF);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchMembers();
    }
  }, [tenantId]);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !tenantId) return;

    setInviting(true);
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Invitation sent! Invite ID: ${data.inviteId}`);
        setInviteEmail('');

        // Send invitation email
        await fetch('/api/invitations/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: inviteEmail,
            role: inviteRole,
            inviteId: data.inviteId,
          }),
        });

        fetchMembers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: TenantRole) => {
    if (!tenantId) return;

    try {
      const response = await fetch(`/api/staff/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        fetchMembers();
      } else {
        alert('Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const response = await fetch(`/api/staff/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMembers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole={[TenantRole.FARM_OWNER, TenantRole.FARM_MANAGER]}>
      <div className='space-y-6 p-6'>
        <div>
          <h1 className='text-3xl font-bold'>Team Management</h1>
          <p className='mt-2 text-gray-600'>Manage your farm team members and their roles</p>
        </div>

        {/* Invite Form */}
        <RoleGuard
          roles={[TenantRole.FARM_OWNER, TenantRole.FARM_MANAGER]}
          permission={{ resource: 'staff', action: 'create' }}
        >
          <Card className='p-6'>
            <h2 className='mb-4 text-xl font-semibold'>Invite Team Member</h2>
            <div className='flex gap-4'>
              <Input
                type='email'
                placeholder='Email address'
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className='flex-1'
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as TenantRole)}
                className='rounded-md border px-3 py-2'
              >
                <option value={TenantRole.FARM_MANAGER}>
                  {ROLE_DISPLAY_NAMES[TenantRole.FARM_MANAGER]}
                </option>
                <option value={TenantRole.VETERINARIAN}>
                  {ROLE_DISPLAY_NAMES[TenantRole.VETERINARIAN]}
                </option>
                <option value={TenantRole.BREEDER}>{ROLE_DISPLAY_NAMES[TenantRole.BREEDER]}</option>
                <option value={TenantRole.MILKING_STAFF}>
                  {ROLE_DISPLAY_NAMES[TenantRole.MILKING_STAFF]}
                </option>
                <option value={TenantRole.FEED_MANAGER}>
                  {ROLE_DISPLAY_NAMES[TenantRole.FEED_MANAGER]}
                </option>
                <option value={TenantRole.ACCOUNTANT}>
                  {ROLE_DISPLAY_NAMES[TenantRole.ACCOUNTANT]}
                </option>
                <option value={TenantRole.GUEST}>{ROLE_DISPLAY_NAMES[TenantRole.GUEST]}</option>
              </select>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                {inviting ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </Card>
        </RoleGuard>

        {/* Members List */}
        <Card className='p-6'>
          <h2 className='mb-4 text-xl font-semibold'>Team Members</h2>
          <div className='space-y-4'>
            {members.length === 0 ? (
              <p className='py-8 text-center text-gray-500'>
                No team members yet. Invite someone to get started!
              </p>
            ) : (
              members.map(member => (
                <div
                  key={member.id}
                  className='flex items-center justify-between rounded-lg border p-4'
                >
                  <div>
                    <p className='font-semibold'>{member.email}</p>
                    <p className='text-sm text-gray-600'>
                      Status: {member.status}
                      {member.joinedAt && (
                        <span className='ml-2'>
                          • Joined: {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className='flex items-center gap-4'>
                    {hasPermission('staff', 'update') ? (
                      <select
                        value={member.role}
                        onChange={e => handleRoleChange(member.id, e.target.value as TenantRole)}
                        disabled={member.role === TenantRole.FARM_OWNER}
                        className='rounded-md border px-3 py-2'
                      >
                        {Object.values(TenantRole).map(role => (
                          <option key={role} value={role}>
                            {ROLE_DISPLAY_NAMES[role]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className='text-sm capitalize'>{ROLE_DISPLAY_NAMES[member.role]}</span>
                    )}

                    {isOwner && member.role !== TenantRole.FARM_OWNER && (
                      <Button variant='destructive' onClick={() => handleRemove(member.id)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
