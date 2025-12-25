// Super Admin - Users Management Page
'use client';
import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Loader2,
  ChevronDown,
  Calendar,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  platformRole: 'super_admin' | 'admin' | 'user';
  isActive: boolean;
  emailVerified: boolean;
  farmCount: number;
  lastLoginAt?: string;
  createdAt: string;
}
const roleConfig = {
  super_admin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700', icon: ShieldCheck },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-700', icon: Shield },
  user: { label: 'User', color: 'bg-gray-100 text-gray-700', icon: Users },
};
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState<string>('');
  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);
  async function fetchUsers() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        // Mock data for demo
        setUsers([
          {
            id: '1',
            name: 'Malik Kashif',
            email: 'mtkdairy@gmail.com',
            platformRole: 'super_admin',
            isActive: true,
            emailVerified: true,
            farmCount: 0,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Ahmad Khan',
            email: 'ahmad@example.com',
            platformRole: 'user',
            isActive: true,
            emailVerified: true,
            farmCount: 1,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }
  async function updateUserRole() {
    if (!selectedUser || !newRole) return;
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (response.ok) {
        toast.success('User role updated successfully');
        setShowRoleDialog(false);
        fetchUsers();
      } else {
        toast.error('Failed to update role');
      }
    } catch (error) {
      toast.error('Failed to update role');
    }
  }
  async function toggleUserStatus(user: User) {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (response.ok) {
        toast.success(user.isActive ? 'User deactivated' : 'User activated');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  }
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.platformRole === roleFilter;
    return matchesSearch && matchesRole;
  });
  return (
    <div className='space-y-4 md:space-y-6'>
      {/* Page Header */}
      <div className='flex flex-col gap-2'>
        <h1 className='text-xl font-bold md:text-2xl dark:text-white'>Users</h1>
        <p className='text-sm text-gray-500 dark:text-slate-400'>
          Manage platform users and their roles
        </p>
      </div>
      {/* Stats Cards */}
      <div className='grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4'>
        <div className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-blue-100 p-2'>
              <Users className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <p className='text-2xl font-bold dark:text-white'>{users.length}</p>
              <p className='text-xs text-gray-500'>Total Users</p>
            </div>
          </div>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-emerald-100 p-2'>
              <UserCheck className='h-5 w-5 text-emerald-600' />
            </div>
            <div>
              <p className='text-2xl font-bold dark:text-white'>
                {users.filter(u => u.isActive).length}
              </p>
              <p className='text-xs text-gray-500'>Active</p>
            </div>
          </div>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-purple-100 p-2'>
              <ShieldCheck className='h-5 w-5 text-purple-600' />
            </div>
            <div>
              <p className='text-2xl font-bold dark:text-white'>
                {users.filter(u => u.platformRole === 'super_admin').length}
              </p>
              <p className='text-xs text-gray-500'>Super Admins</p>
            </div>
          </div>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-amber-100 p-2'>
              <Mail className='h-5 w-5 text-amber-600' />
            </div>
            <div>
              <p className='text-2xl font-bold dark:text-white'>
                {users.filter(u => u.emailVerified).length}
              </p>
              <p className='text-xs text-gray-500'>Verified</p>
            </div>
          </div>
        </div>
      </div>
      {/* Filters */}
      <div className='flex flex-col gap-3 sm:flex-row'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <Input
            placeholder='Search users...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='h-11 pl-10'
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className='h-11 w-full sm:w-44'>
            <Shield className='mr-2 h-4 w-4' />
            <SelectValue placeholder='Role' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Roles</SelectItem>
            <SelectItem value='super_admin'>Super Admin</SelectItem>
            <SelectItem value='admin'>Admin</SelectItem>
            <SelectItem value='user'>User</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Users List */}
      <div className='overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        {loading ? (
          <div className='p-12 text-center'>
            <Loader2 className='mx-auto h-8 w-8 animate-spin text-gray-400' />
            <p className='mt-2 text-gray-500'>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className='p-12 text-center'>
            <Users className='mx-auto h-12 w-12 text-gray-300' />
            <p className='mt-2 text-gray-500'>No users found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className='divide-y divide-gray-100 md:hidden dark:divide-slate-700'>
              {filteredUsers.map(user => {
                const role = roleConfig[user.platformRole];
                const RoleIcon = role.icon;
                return (
                  <div key={user.id} className='space-y-3 p-4'>
                    <div className='flex items-start gap-3'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 font-medium text-white'>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2'>
                          <h3 className='truncate font-medium dark:text-white'>{user.name}</h3>
                          {!user.isActive && (
                            <span className='rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600'>
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className='truncate text-sm text-gray-500'>{user.email}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.platformRole);
                              setShowRoleDialog(true);
                            }}
                          >
                            <Shield className='mr-2 h-4 w-4' /> Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleUserStatus(user)}>
                            {user.isActive ? (
                              <>
                                <UserX className='mr-2 h-4 w-4' /> Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className='mr-2 h-4 w-4' /> Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${role.color}`}
                      >
                        <RoleIcon className='h-3 w-3' />
                        {role.label}
                      </span>
                      {user.emailVerified && (
                        <span className='rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700'>
                          ✓ Verified
                        </span>
                      )}
                      <span className='flex items-center gap-1 text-xs text-gray-500'>
                        <Building2 className='h-3 w-3' /> {user.farmCount} farms
                      </span>
                    </div>
                    <div className='flex items-center gap-4 text-xs text-gray-500'>
                      <span className='flex items-center gap-1'>
                        <Calendar className='h-3 w-3' />
                        Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop Table View */}
            <div className='hidden overflow-x-auto md:block'>
              <table className='w-full'>
                <thead className='bg-gray-50 dark:bg-slate-700/50'>
                  <tr>
                    <th className='px-6 py-4 text-left text-xs font-medium uppercase text-gray-500'>
                      User
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium uppercase text-gray-500'>
                      Role
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium uppercase text-gray-500'>
                      Status
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium uppercase text-gray-500'>
                      Farms
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium uppercase text-gray-500'>
                      Last Login
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium uppercase text-gray-500'>
                      Joined
                    </th>
                    <th className='px-6 py-4 text-right text-xs font-medium uppercase text-gray-500'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100 dark:divide-slate-700'>
                  {filteredUsers.map(user => {
                    const role = roleConfig[user.platformRole];
                    const RoleIcon = role.icon;
                    return (
                      <tr key={user.id} className='hover:bg-gray-50 dark:hover:bg-slate-700/30'>
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-3'>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 font-medium text-white'>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className='font-medium dark:text-white'>{user.name}</p>
                              <p className='text-sm text-gray-500'>{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${role.color}`}
                          >
                            <RoleIcon className='h-3.5 w-3.5' />
                            {role.label}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-2'>
                            <span
                              className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                            />
                            <span className='text-sm'>{user.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </td>
                        <td className='px-6 py-4 text-sm'>{user.farmCount}</td>
                        <td className='px-6 py-4 text-sm text-gray-500'>
                          {user.lastLoginAt
                            ? format(new Date(user.lastLoginAt), 'MMM d, yyyy')
                            : '-'}
                        </td>
                        <td className='px-6 py-4 text-sm text-gray-500'>
                          {format(new Date(user.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className='px-6 py-4 text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm'>
                                Actions <ChevronDown className='ml-1 h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewRole(user.platformRole);
                                  setShowRoleDialog(true);
                                }}
                              >
                                <Shield className='mr-2 h-4 w-4' /> Change Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleUserStatus(user)}>
                                {user.isActive ? (
                                  <>
                                    <UserX className='mr-2 h-4 w-4' /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className='mr-2 h-4 w-4' /> Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>Update the platform role for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select role' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='user'>User</SelectItem>
                <SelectItem value='admin'>Admin</SelectItem>
                <SelectItem value='super_admin'>Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateUserRole} className='bg-emerald-600 hover:bg-emerald-700'>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}