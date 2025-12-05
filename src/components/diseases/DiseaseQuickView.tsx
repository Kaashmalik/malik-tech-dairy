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

export function DiseaseQuickView({ limit = 6, showSearch = true, className = '' }: DiseaseQuickViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);

  const filteredDiseases = diseases
    .filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.symptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .slice(0, limit);

  // Get critical diseases for quick alert
  const criticalDiseases = diseases.filter(d => d.severity === 'critical');

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Bug className="w-5 h-5" />
            <h3 className="font-semibold">Disease Guide</h3>
          </div>
          <Link href="/diseases">
            <Button size="sm" variant="secondary" className="text-xs">
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
        
        {showSearch && (
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-200" />
            <Input
              placeholder="Search diseases or symptoms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/20 border-white/30 text-white placeholder:text-emerald-100 text-sm"
            />
          </div>
        )}
      </div>

      {/* Critical Alert Banner */}
      <div className="bg-red-50 dark:bg-red-900/20 p-3 border-b border-red-100 dark:border-red-800">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-medium">
            {criticalDiseases.length} Critical diseases require immediate vet attention
          </span>
        </div>
      </div>

      {/* Disease List */}
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {filteredDiseases.map((disease) => (
          <motion.div
            key={disease.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedDisease(disease)}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-xl">{disease.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                {disease.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                {disease.symptoms[0]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {disease.vaccineAvailable && (
                <Syringe className="w-3 h-3 text-emerald-500" />
              )}
              {disease.emergencyCall && (
                <Phone className="w-3 h-3 text-red-500" />
              )}
              <Badge className={`text-xs ${severityColors[disease.severity]}`}>
                {disease.severity}
              </Badge>
            </div>
          </motion.div>
        ))}

        {filteredDiseases.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-slate-400 text-sm">
            No diseases found matching your search
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-t dark:border-slate-700">
        <div className="flex gap-2">
          <Link href="/diseases?severity=critical" className="flex-1">
            <Button variant="destructive" size="sm" className="w-full text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Critical
            </Button>
          </Link>
          <Link href="/diseases?category=viral" className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Viral
            </Button>
          </Link>
          <Link href="/diseases?category=neonatal" className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs">
              <Baby className="w-3 h-3 mr-1" />
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDisease(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-5 shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedDisease.icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {selectedDisease.name}
                    </h3>
                    <Badge className={severityColors[selectedDisease.severity]}>
                      {selectedDisease.severity}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDisease(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-1">
                    Key Symptoms
                  </p>
                  <ul className="text-sm text-gray-700 dark:text-slate-300 space-y-1">
                    {selectedDisease.symptoms.slice(0, 3).map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-500">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Mortality</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedDisease.mortality}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Vaccine</p>
                    <p className={`font-medium ${selectedDisease.vaccineAvailable ? 'text-emerald-600' : 'text-red-600'}`}>
                      {selectedDisease.vaccineAvailable ? 'Available' : 'None'}
                    </p>
                  </div>
                  {selectedDisease.recoveryTime && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Recovery</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedDisease.recoveryTime}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/diseases?search=${selectedDisease.name}`} className="flex-1">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
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
    <Link href="/diseases">
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3">
          <Bug className="w-8 h-8" />
          <Badge className="bg-white/20 text-white">
            {diseases.length} Diseases
          </Badge>
        </div>
        <h3 className="text-lg font-bold mb-1">Disease Guide</h3>
        <p className="text-emerald-100 text-sm mb-3">
          Complete veterinary reference for cow &amp; buffalo health
        </p>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-red-300" />
            <span>{criticalCount} Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <Syringe className="w-4 h-4 text-emerald-200" />
            <span>{vaccineCount} Vaccines</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
