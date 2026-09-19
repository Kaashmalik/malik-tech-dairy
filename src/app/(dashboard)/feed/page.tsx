import { Metadata } from 'next';
import { FeedManagementDashboard } from '@/components/feed/FeedManagementDashboard';

export const metadata: Metadata = {
  title: 'Feed Management | MTK Dairy',
  description: 'Manage feed inventory, nutrition optimization, and ration analytics.',
};

export const dynamic = 'force-dynamic';

export default function FeedPage() {
  return (
    <div className='container mx-auto space-y-6 py-4'>
      <FeedManagementDashboard />
    </div>
  );
}
