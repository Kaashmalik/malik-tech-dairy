import { Metadata } from 'next';
import { TaskManager } from '@/components/tasks/TaskManager';

export const metadata: Metadata = {
  title: 'Farm Tasks & Operations | MTK Dairy',
  description:
    'Manage, assign, and track operational tasks, daily livestock routines, and farm staff duties.',
};

export const dynamic = 'force-dynamic';

export default function TasksPage() {
  return (
    <div className='container mx-auto space-y-6 py-4'>
      <TaskManager />
    </div>
  );
}
