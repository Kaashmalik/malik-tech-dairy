'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ChevronRight,
  Search,
  Shield,
  Syringe,
  Phone,
  Bug,
  Baby,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { diseases, type Disease, type DiseaseSeverity } from '@/lib/data/diseases';

const severityColors: Record<DiseaseSeverity, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  moderate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

interface DiseaseQuickViewProps {
  limit?: number;
  showSearch?: boolean;
  className?: string;
}

export function DiseaseQuickView({
  limit = 6,
  showSearch = true,
  className = '',
}: DiseaseQuickViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);

  const filteredDiseases = diseases
    .filter(
      d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.symptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .slice(0, limit);

  // Get critical diseases for quick alert
  const criticalDiseases = diseases.filter(d => d.severity === 'critical');

  return (
    <div className={`overflow-hidden rounded-xl bg-white shadow-lg dark:bg-slate-800 ${className}`}>
      {/* Header */}
      <div className='bg-gradient-to-r from-emerald-500 to-teal-500 p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2 text-white'>
            <Bug className='h-5 w-5' />
            <h3 className='font-semibold'>Disease Guide</h3>
          </div>
          <Link href='/diseases'>
            <Button size='sm' variant='secondary' className='text-xs'>
              View All <ChevronRight className='ml-1 h-3 w-3' />
            </Button>
          </Link>
        </div>

        {showSearch && (
          <div className='relative mt-3'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-200' />
            <Input
              placeholder='Search diseases or symptoms...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='border-white/30 bg-white/20 pl-9 text-sm text-white placeholder:text-emerald-100'
            />
          </div>
        )}
      </div>

      {/* Critical Alert Banner */}
      <div className='border-b border-red-100 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20'>
        <div className='flex items-center gap-2 text-red-700 dark:text-red-400'>
          <AlertTriangle className='h-4 w-4' />
          <span className='text-xs font-medium'>
            {criticalDiseases.length} Critical diseases require immediate vet attention
          </span>
        </div>
      </div>

      {/* Disease List */}
      <div className='max-h-80 space-y-3 overflow-y-auto p-4'>
        {filteredDiseases.map(disease => (
          <motion.div
            key={disease.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedDisease(disease)}
            className='flex cursor-pointer items-center gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-slate-700/50 dark:hover:bg-slate-700'
          >
            <span className='text-xl'>{disease.icon}</span>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                {disease.name}
              </p>
              <p className='truncate text-xs text-gray-500 dark:text-slate-400'>
                {disease.symptoms[0]}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              {disease.vaccineAvailable && <Syringe className='h-3 w-3 text-emerald-500' />}
              {disease.emergencyCall && <Phone className='h-3 w-3 text-red-500' />}
              <Badge className={`text-xs ${severityColors[disease.severity]}`}>
                {disease.severity}
              </Badge>
            </div>
          </motion.div>
        ))}

        {filteredDiseases.length === 0 && (
          <div className='py-4 text-center text-sm text-gray-500 dark:text-slate-400'>
            No diseases found matching your search
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className='border-t bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900/50'>
        <div className='flex gap-2'>
          <Link href='/diseases?severity=critical' className='flex-1'>
            <Button variant='destructive' size='sm' className='w-full text-xs'>
              <AlertTriangle className='mr-1 h-3 w-3' />
              Critical
            </Button>
          </Link>
          <Link href='/diseases?category=viral' className='flex-1'>
            <Button variant='outline' size='sm' className='w-full text-xs'>
              <Shield className='mr-1 h-3 w-3' />
              Viral
            </Button>
          </Link>
          <Link href='/diseases?category=neonatal' className='flex-1'>
            <Button variant='outline' size='sm' className='w-full text-xs'>
              <Baby className='mr-1 h-3 w-3' />
              Calf
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Detail Modal */}
      <AnimatePresence>
        {selectedDisease && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
            onClick={() => setSelectedDisease(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className='w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-slate-800'
            >
              <div className='mb-4 flex items-start justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='text-3xl'>{selectedDisease.icon}</span>
                  <div>
                    <h3 className='font-bold text-gray-900 dark:text-white'>
                      {selectedDisease.name}
                    </h3>
                    <Badge className={severityColors[selectedDisease.severity]}>
                      {selectedDisease.severity}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDisease(null)}
                  className='rounded-full p-1 hover:bg-gray-100 dark:hover:bg-slate-700'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>

              <div className='mb-4 space-y-3'>
                <div>
                  <p className='mb-1 text-xs font-medium uppercase text-gray-500 dark:text-slate-400'>
                    Key Symptoms
                  </p>
                  <ul className='space-y-1 text-sm text-gray-700 dark:text-slate-300'>
                    {selectedDisease.symptoms.slice(0, 3).map((s, i) => (
                      <li key={i} className='flex items-start gap-2'>
                        <span className='text-red-500'>•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className='flex gap-4 text-sm'>
                  <div>
                    <p className='text-xs text-gray-500 dark:text-slate-400'>Mortality</p>
                    <p className='font-medium text-gray-900 dark:text-white'>
                      {selectedDisease.mortality}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 dark:text-slate-400'>Vaccine</p>
                    <p
                      className={`font-medium ${selectedDisease.vaccineAvailable ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {selectedDisease.vaccineAvailable ? 'Available' : 'None'}
                    </p>
                  </div>
                  {selectedDisease.recoveryTime && (
                    <div>
                      <p className='text-xs text-gray-500 dark:text-slate-400'>Recovery</p>
                      <p className='font-medium text-gray-900 dark:text-white'>
                        {selectedDisease.recoveryTime}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className='flex gap-2'>
                <Link href={`/diseases?search=${selectedDisease.name}`} className='flex-1'>
                  <Button className='w-full bg-emerald-500 hover:bg-emerald-600'>
                    View Full Details
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export a simpler card version for dashboard widgets
export function DiseaseAlertCard() {
  const criticalCount = diseases.filter(d => d.severity === 'critical').length;
  const vaccineCount = diseases.filter(d => d.vaccineAvailable).length;

  return (
    <Link href='/diseases'>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className='cursor-pointer rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white'
      >
        <div className='mb-3 flex items-center justify-between'>
          <Bug className='h-8 w-8' />
          <Badge className='bg-white/20 text-white'>{diseases.length} Diseases</Badge>
        </div>
        <h3 className='mb-1 text-lg font-bold'>Disease Guide</h3>
        <p className='mb-3 text-sm text-emerald-100'>
          Complete veterinary reference for cow &amp; buffalo health
        </p>
        <div className='flex gap-4 text-sm'>
          <div className='flex items-center gap-1'>
            <AlertTriangle className='h-4 w-4 text-red-300' />
            <span>{criticalCount} Critical</span>
          </div>
          <div className='flex items-center gap-1'>
            <Syringe className='h-4 w-4 text-emerald-200' />
            <span>{vaccineCount} Vaccines</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
