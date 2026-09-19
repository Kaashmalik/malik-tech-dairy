'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  User,
  Beef,
  Calendar,
  Trash2,
  ArrowRight,
  Check,
  RotateCcw,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  tenantId: string;
  assignedTo: string;
  assignedBy: string;
  taskType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description?: string;
  animalId?: string;
  dueDate: string;
  estimatedDuration?: number;
  actualDuration?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  completionNotes?: string;
  createdAt: string;
  isOverdue?: boolean;
  assignedToUser?: {
    id: string;
    name: string;
    email: string;
  };
  animal?: {
    id: string;
    tagNumber: string;
    name?: string;
  };
}

interface StaffMember {
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface AnimalItem {
  id: string;
  tagNumber: string;
  name?: string;
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [animalsList, setAnimalsList] = useState<AnimalItem[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: 'milking',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    assignedTo: '',
    animalId: '',
    dueDate: '',
    estimatedDuration: 30,
  });

  // Fetch Tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter !== 'all') {
        if (statusFilter === 'overdue') {
          params.append('overdue', 'true');
        } else {
          params.append('status', statusFilter);
        }
      }
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (typeFilter !== 'all') params.append('taskType', typeFilter);

      const res = await fetch(`/api/staff-management/tasks?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const json = await res.json();
      if (json.success && json.data) {
        setTasks(json.data.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Staff & Animals for create form
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // Fetch staff
        const staffRes = await fetch('/api/staff');
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          const members: StaffMember[] = (staffData.members || []).map((m: any) => ({
            userId: m.user_id || m.platform_users?.id,
            name: m.platform_users?.name || m.platform_users?.email || 'Farm Staff',
            email: m.platform_users?.email || '',
            role: m.role || 'worker',
          }));
          setStaff(members);
          if (members.length > 0 && !formData.assignedTo) {
            setFormData(prev => ({ ...prev, assignedTo: members[0].userId }));
          }
        }

        // Fetch animals
        const animalsRes = await fetch('/api/animals?limit=100');
        if (animalsRes.ok) {
          const animalsData = await animalsRes.json();
          const items: AnimalItem[] = (animalsData.animals || animalsData.data || []).map(
            (a: any) => ({
              id: a.id,
              tagNumber: a.tagNumber || a.tag_number || a.id.slice(0, 6),
              name: a.name || '',
            })
          );
          setAnimalsList(items);
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    };

    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, typeFilter]);

  // Update Task Status
  const handleUpdateStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const res = await fetch(`/api/staff-management/tasks?id=${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t)));
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/staff-management/tasks?id=${taskId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.assignedTo || !formData.dueDate) {
      alert('Please fill in all required fields (title, assignee, due date).');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
        taskType: formData.taskType,
        priority: formData.priority,
        assignedTo: formData.assignedTo,
        dueDate: new Date(formData.dueDate).toISOString(),
        estimatedDuration: Number(formData.estimatedDuration) || 30,
      };
      if (formData.animalId) {
        payload.animalId = formData.animalId;
      }

      const res = await fetch('/api/staff-management/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        taskType: 'milking',
        priority: 'medium',
        assignedTo: staff[0]?.userId || '',
        animalId: '',
        dueDate: '',
        estimatedDuration: 30,
      });
      await fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(
    t => t.isOverdue || (new Date(t.dueDate) < new Date() && t.status !== 'completed')
  ).length;

  const filteredTasks = tasks.filter(task => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchType = task.taskType.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchType) return false;
    }
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className='inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'>
            <span className='mr-1.5 h-1.5 w-1.5 animate-ping rounded-full bg-rose-500'></span>
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className='inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'>
            High
          </span>
        );
      case 'medium':
        return (
          <span className='inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'>
            Medium
          </span>
        );
      default:
        return (
          <span className='inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: string, isOverdue?: boolean) => {
    if (isOverdue && status !== 'completed') {
      return (
        <span className='inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300'>
          <AlertTriangle className='mr-1 h-3 w-3' />
          Overdue
        </span>
      );
    }
    switch (status) {
      case 'completed':
        return (
          <span className='inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'>
            <CheckCircle2 className='mr-1 h-3 w-3' />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className='inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300'>
            <RotateCcw className='mr-1 h-3 w-3 animate-spin' />
            In Progress
          </span>
        );
      default:
        return (
          <span className='inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'>
            <Clock className='mr-1 h-3 w-3' />
            Pending
          </span>
        );
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header & Action */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-white'>
            Operational Farm Tasks
          </h1>
          <p className='mt-1 text-sm text-neutral-500 dark:text-neutral-400'>
            Assign, schedule, and track daily dairy routines and livestock operations
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className='bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'
        >
          <Plus className='mr-2 h-4 w-4' />
          New Task Assignment
        </Button>
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5'>
        <Card className='border-neutral-200/80 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80'>
          <CardContent className='flex items-center justify-between p-4'>
            <div>
              <p className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
                Total Tasks
              </p>
              <p className='mt-1 text-2xl font-bold text-neutral-900 dark:text-white'>
                {totalTasks}
              </p>
            </div>
            <div className='rounded-xl bg-neutral-100 p-2.5 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'>
              <ClipboardList className='h-5 w-5' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-neutral-200/80 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80'>
          <CardContent className='flex items-center justify-between p-4'>
            <div>
              <p className='text-xs font-medium text-amber-600 dark:text-amber-400'>Pending</p>
              <p className='mt-1 text-2xl font-bold text-neutral-900 dark:text-white'>
                {pendingTasks}
              </p>
            </div>
            <div className='rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/50'>
              <Clock className='h-5 w-5' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-neutral-200/80 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80'>
          <CardContent className='flex items-center justify-between p-4'>
            <div>
              <p className='text-xs font-medium text-cyan-600 dark:text-cyan-400'>In Progress</p>
              <p className='mt-1 text-2xl font-bold text-neutral-900 dark:text-white'>
                {inProgressTasks}
              </p>
            </div>
            <div className='rounded-xl bg-cyan-50 p-2.5 text-cyan-600 dark:bg-cyan-950/50'>
              <RotateCcw className='h-5 w-5' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-neutral-200/80 bg-white/80 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80'>
          <CardContent className='flex items-center justify-between p-4'>
            <div>
              <p className='text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                Completed
              </p>
              <p className='mt-1 text-2xl font-bold text-neutral-900 dark:text-white'>
                {completedTasks}
              </p>
            </div>
            <div className='rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/50'>
              <CheckCircle2 className='h-5 w-5' />
            </div>
          </CardContent>
        </Card>

        <Card className='col-span-2 border-neutral-200/80 bg-white/80 backdrop-blur-sm sm:col-span-1 dark:border-neutral-800 dark:bg-neutral-900/80'>
          <CardContent className='flex items-center justify-between p-4'>
            <div>
              <p className='text-xs font-medium text-rose-600 dark:text-rose-400'>Overdue</p>
              <p className='mt-1 text-2xl font-bold text-neutral-900 dark:text-white'>
                {overdueTasks}
              </p>
            </div>
            <div className='rounded-xl bg-rose-50 p-2.5 text-rose-600 dark:bg-rose-950/50'>
              <AlertTriangle className='h-5 w-5' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className='flex flex-col items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md md:flex-row dark:border-neutral-800 dark:bg-neutral-900/90'>
        <div className='relative w-full md:w-72'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400' />
          <input
            type='text'
            placeholder='Search tasks or activities...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
          />
        </div>

        <div className='flex w-full flex-wrap items-center gap-2 md:w-auto'>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className='rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
          >
            <option value='all'>All Statuses</option>
            <option value='pending'>Pending</option>
            <option value='in_progress'>In Progress</option>
            <option value='completed'>Completed</option>
            <option value='overdue'>Overdue</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className='rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
          >
            <option value='all'>All Priorities</option>
            <option value='urgent'>Urgent</option>
            <option value='high'>High</option>
            <option value='medium'>Medium</option>
            <option value='low'>Low</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className='rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
          >
            <option value='all'>All Types</option>
            <option value='milking'>Milking</option>
            <option value='feeding'>Feeding</option>
            <option value='cleaning'>Cleaning</option>
            <option value='treatment'>Treatment</option>
            <option value='vaccination'>Vaccination</option>
            <option value='maintenance'>Maintenance</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className='space-y-3'>
        {loading ? (
          <div className='p-12 text-center text-neutral-400'>
            <Loader2 className='mx-auto mb-3 h-8 w-8 animate-spin text-emerald-600' />
            <p className='text-sm'>Loading farm operations and tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className='rounded-2xl border border-neutral-200/80 bg-white/80 p-12 text-center dark:border-neutral-800 dark:bg-neutral-900/80'>
            <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'>
              <CheckCircle2 className='h-6 w-6' />
            </div>
            <h3 className='text-base font-semibold text-neutral-900 dark:text-white'>
              No tasks found
            </h3>
            <p className='mx-auto mt-1 max-w-sm text-xs text-neutral-500'>
              No tasks match your current filter settings, or no farm operational tasks have been
              assigned yet.
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className='mt-4 bg-emerald-600 text-xs text-white hover:bg-emerald-700'
            >
              <Plus className='mr-1.5 h-3.5 w-3.5' />
              Create Task Now
            </Button>
          </div>
        ) : (
          filteredTasks.map(task => {
            const dueDateObj = new Date(task.dueDate);
            const isDueSoon = !task.isOverdue && dueDateObj.getTime() - Date.now() < 86400000 * 2;

            return (
              <div
                key={task.id}
                className='flex flex-col justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm transition-all hover:border-emerald-500/50 md:flex-row md:items-center dark:border-neutral-800 dark:bg-neutral-900'
              >
                {/* Task Details */}
                <div className='flex-1 space-y-2'>
                  <div className='flex flex-wrap items-center gap-2'>
                    {getStatusBadge(task.status, task.isOverdue)}
                    {getPriorityBadge(task.priority)}
                    <span className='rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium capitalize text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'>
                      {task.taskType}
                    </span>
                    {task.animal && (
                      <span className='inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'>
                        <Beef className='mr-1 h-3 w-3' />
                        Tag #{task.animal.tagNumber}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className='text-base font-semibold text-neutral-900 dark:text-white'>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className='mt-0.5 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400'>
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className='flex flex-wrap items-center gap-4 pt-1 text-xs text-neutral-500 dark:text-neutral-400'>
                    <div className='flex items-center'>
                      <Calendar className='mr-1 h-3.5 w-3.5 text-neutral-400' />
                      <span>
                        Due:{' '}
                        {dueDateObj.toLocaleDateString('en-PK', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {task.assignedToUser && (
                      <div className='flex items-center'>
                        <User className='mr-1 h-3.5 w-3.5 text-neutral-400' />
                        <span>Assigned to: {task.assignedToUser.name}</span>
                      </div>
                    )}

                    {task.estimatedDuration && (
                      <div className='flex items-center'>
                        <Clock className='mr-1 h-3.5 w-3.5 text-neutral-400' />
                        <span>Est: {task.estimatedDuration} mins</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className='flex items-center gap-2 border-t border-neutral-100 pt-3 md:border-t-0 md:pt-0 dark:border-neutral-800'>
                  {task.status === 'pending' && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                      className='border-cyan-200 text-xs text-cyan-700 hover:bg-cyan-50 dark:border-cyan-900 dark:text-cyan-300'
                    >
                      <RotateCcw className='mr-1 h-3.5 w-3.5' />
                      Start
                    </Button>
                  )}

                  {task.status !== 'completed' && (
                    <Button
                      size='sm'
                      onClick={() => handleUpdateStatus(task.id, 'completed')}
                      className='bg-emerald-600 text-xs text-white hover:bg-emerald-700'
                    >
                      <Check className='mr-1 h-3.5 w-3.5' />
                      Complete
                    </Button>
                  )}

                  {task.status === 'completed' && (
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => handleUpdateStatus(task.id, 'pending')}
                      className='text-xs text-neutral-500 hover:text-neutral-700'
                    >
                      Reopen
                    </Button>
                  )}

                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => handleDeleteTask(task.id)}
                    className='p-2 text-neutral-400 hover:text-rose-600'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm'>
          <div className='animate-in fade-in zoom-in-95 relative w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl duration-150 dark:border-neutral-800 dark:bg-neutral-900'>
            <div className='flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800'>
              <h2 className='flex items-center text-lg font-bold text-neutral-900 dark:text-white'>
                <ClipboardList className='mr-2 h-5 w-5 text-emerald-600' />
                Assign Operational Task
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className='rounded-full p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className='space-y-4 pt-4'>
              <div>
                <label className='mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                  Task Title *
                </label>
                <input
                  type='text'
                  required
                  placeholder='e.g. Morning Milking Parlor A'
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className='w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    Task Type
                  </label>
                  <select
                    value={formData.taskType}
                    onChange={e => setFormData({ ...formData, taskType: e.target.value })}
                    className='w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
                  >
                    <option value='milking'>Milking</option>
                    <option value='feeding'>Feeding</option>
                    <option value='cleaning'>Cleaning</option>
                    <option value='treatment'>Treatment</option>
                    <option value='vaccination'>Vaccination</option>
                    <option value='maintenance'>Maintenance</option>
                    <option value='general'>General</option>
                  </select>
                </div>

                <div>
                  <label className='mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                    className='w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
                  >
                    <option value='low'>Low</option>
                    <option value='medium'>Medium</option>
                    <option value='high'>High</option>
                    <option value='urgent'>Urgent</option>
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    Assign To *
                  </label>
                  <select
                    required
                    value={formData.assignedTo}
                    onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                    className='w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
                  >
                    <option value='' disabled>
                      Select Staff
                    </option>
                    {staff.map(s => (
                      <option key={s.userId} value={s.userId}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    Related Animal (Optional)
                  </label>
                  <select
                    value={formData.animalId}
                    onChange={e => setFormData({ ...formData, animalId: e.target.value })}
                    className='w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
                  >
                    <option value=''>None / Herd-wide</option>
                    {animalsList.map(a => (
                      <option key={a.id} value={a.id}>
                        Tag #{a.tagNumber} {a.name ? `(${a.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    Due Date & Time *
                  </label>
                  <input
                    type='datetime-local'
                    required
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className='w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
                  />
                </div>

                <div>
                  <label className='mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                    Est. Duration (Minutes)
                  </label>
                  <input
                    type='number'
                    min='5'
                    max='480'
                    value={formData.estimatedDuration}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        estimatedDuration: parseInt(e.target.value) || 30,
                      })
                    }
                    className='w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
                  />
                </div>
              </div>

              <div>
                <label className='mb-1 block text-xs font-semibold text-neutral-700 dark:text-neutral-300'>
                  Instructions & Description
                </label>
                <textarea
                  rows={3}
                  placeholder='Specific instructions for farm hands, feed ratios, or protocol...'
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className='w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'
                ></textarea>
              </div>

              <div className='flex items-center justify-end gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800'>
                <Button type='button' variant='ghost' onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={submitting}
                  className='bg-emerald-600 text-white hover:bg-emerald-700'
                >
                  {submitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Assigning...
                    </>
                  ) : (
                    'Create Assignment'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
