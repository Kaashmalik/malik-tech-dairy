import { cn } from '@/lib/utils';
import {
  FileText,
  Package,
  Search,
  AlertCircle,
  PlusCircle,
  Upload,
  Download,
  BarChart3,
  TrendingUp,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  Home,
  Heart,
  Baby,
  Bug,
  DollarSign,
  Droplets,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {icon && (
        <div className='bg-muted text-muted-foreground mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
          {icon}
        </div>
      )}
      <h3 className='mb-2 text-lg font-semibold'>{title}</h3>
      <p className='text-muted-foreground mb-6 max-w-md'>{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 transition-colors'
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Specific empty states for different contexts
export function EmptyAnimals({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<Package className='h-8 w-8' />}
      title='No animals yet'
      description='Start by adding your first animal to track its health, milk production, and breeding records.'
      action={
        onAdd ? { label: 'Add Animal', onClick: onAdd } : { label: 'Add Animal', onClick: () => {} }
      }
    />
  );
}

export function EmptyMilkRecords({ onLog }: { onLog?: () => void }) {
  return (
    <EmptyState
      icon={<Droplets className='h-8 w-8' />}
      title='No milk records'
      description='Log your first milk production entry to start tracking yields and trends.'
      action={
        onLog ? { label: 'Log Milk', onClick: onLog } : { label: 'Log Milk', onClick: () => {} }
      }
    />
  );
}

export function EmptyHealthRecords({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<Heart className='h-8 w-8' />}
      title='No health records'
      description='Keep track of vaccinations, treatments, and health checkups for your animals.'
      action={
        onAdd ? { label: 'Add Record', onClick: onAdd } : { label: 'Add Record', onClick: () => {} }
      }
    />
  );
}

export function EmptyBreedingRecords({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<Baby className='h-8 w-8' />}
      title='No breeding records'
      description='Monitor breeding cycles, pregnancies, and birth records for better herd management.'
      action={
        onAdd ? { label: 'Add Record', onClick: onAdd } : { label: 'Add Record', onClick: () => {} }
      }
    />
  );
}

export function EmptyDiseaseRecords({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<Bug className='h-8 w-8' />}
      title='No disease records'
      description='Track disease outbreaks, treatments, and prevention measures for herd health.'
      action={
        onAdd ? { label: 'Add Record', onClick: onAdd } : { label: 'Add Record', onClick: () => {} }
      }
    />
  );
}

export function EmptyFinanceRecords({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<DollarSign className='h-8 w-8' />}
      title='No financial records'
      description="Track expenses and income to monitor your farm's financial health."
      action={
        onAdd ? { label: 'Add Record', onClick: onAdd } : { label: 'Add Record', onClick: () => {} }
      }
    />
  );
}

export function EmptySearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={<Search className='h-8 w-8' />}
      title='No results found'
      description={
        query
          ? `No items found matching "${query}". Try adjusting your search terms.`
          : 'No items found. Try adjusting your filters or search terms.'
      }
    />
  );
}

export function EmptyAnalytics() {
  return (
    <EmptyState
      icon={<BarChart3 className='h-8 w-8' />}
      title='No data to analyze'
      description="Start adding records to see insights and trends about your farm's performance."
    />
  );
}

export function EmptyUpload({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={<Upload className='h-8 w-8' />}
      title='No file selected'
      description='Choose a CSV or Excel file to import data into your farm.'
      action={
        onUpload
          ? { label: 'Select File', onClick: onUpload }
          : { label: 'Select File', onClick: () => {} }
      }
    />
  );
}

export function EmptyExports({ onExport }: { onExport?: () => void }) {
  return (
    <EmptyState
      icon={<Download className='h-8 w-8' />}
      title='No exports available'
      description='Generate reports and export your farm data in various formats.'
      action={
        onExport
          ? { label: 'Create Export', onClick: onExport }
          : { label: 'Create Export', onClick: () => {} }
      }
    />
  );
}

export function EmptyOffline() {
  return (
    <EmptyState
      icon={<WifiOff className='h-8 w-8' />}
      title="You're offline"
      description='Some features may be limited. Your data will sync when you reconnect.'
    />
  );
}

export function EmptyError({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<AlertCircle className='text-destructive h-8 w-8' />}
      title='Something went wrong'
      description='We encountered an error while loading this data. Please try again.'
      action={
        onRetry
          ? { label: 'Try Again', onClick: onRetry }
          : { label: 'Try Again', onClick: () => {} }
      }
    />
  );
}

export function EmptyLoading() {
  return (
    <EmptyState
      icon={<RefreshCw className='h-8 w-8 animate-spin' />}
      title='Loading...'
      description='Please wait while we fetch your data.'
    />
  );
}
