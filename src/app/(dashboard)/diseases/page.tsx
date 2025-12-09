'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  AlertTriangle,
  Shield,
  Syringe,
  Heart,
  Bug,
  Baby,
  Stethoscope,
  Eye,
  Wind,
  ChevronDown,
  ChevronRight,
  Phone,
  Star,
  Clock,
  Skull,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pill,
  Calendar,
  BookOpen,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  diseases,
  diseaseCategories,
  preventionTips,
  vaccinationSchedule,
  recommendedProducts,
  emergencyRedFlags,
  type Disease,
  type DiseaseCategory,
  type DiseaseSeverity,
} from '@/lib/data/diseases';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity },
};

// Severity colors and icons
const severityConfig: Record<
  DiseaseSeverity,
  { color: string; bg: string; icon: React.ReactNode }
> = {
  critical: {
    color: 'text-red-600',
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: <Skull className='h-4 w-4' />,
  },
  high: {
    color: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    icon: <AlertTriangle className='h-4 w-4' />,
  },
  moderate: {
    color: 'text-yellow-600',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: <AlertCircle className='h-4 w-4' />,
  },
  low: {
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: <CheckCircle2 className='h-4 w-4' />,
  },
};

// Category icons
const categoryIcons: Record<DiseaseCategory, React.ReactNode> = {
  viral: <Bug className='h-5 w-5' />,
  bacterial: <Stethoscope className='h-5 w-5' />,
  parasitic: <Bug className='h-5 w-5' />,
  metabolic: <Heart className='h-5 w-5' />,
  respiratory: <Wind className='h-5 w-5' />,
  reproductive: <Users className='h-5 w-5' />,
  skin: <Eye className='h-5 w-5' />,
  neonatal: <Baby className='h-5 w-5' />,
};

// Disease Card Component
function DiseaseCard({ disease, onClick }: { disease: Disease; onClick: () => void }) {
  const severity = severityConfig[disease.severity];

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className='cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg transition-all hover:shadow-xl dark:border-slate-700 dark:bg-slate-800'
    >
      {/* Severity indicator bar */}
      <div className={`h-1 ${severity.bg.replace('bg-', 'bg-').replace('/30', '')}`} />

      <div className='p-5'>
        {/* Header */}
        <div className='mb-3 flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            <span className='text-2xl'>{disease.icon}</span>
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-white'>{disease.name}</h3>
              {disease.nickname && (
                <p className='text-xs text-gray-500 dark:text-slate-400'>
                  &quot;{disease.nickname}&quot;
                </p>
              )}
            </div>
          </div>
          <Badge className={`${severity.bg} ${severity.color} border-0`}>{disease.severity}</Badge>
        </div>

        {/* Quick stats */}
        <div className='mb-3 flex flex-wrap gap-2'>
          {disease.vaccineAvailable && (
            <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'>
              <Syringe className='h-3 w-3' /> Vaccine
            </span>
          )}
          {disease.contagious && (
            <span className='inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'>
              <Users className='h-3 w-3' /> Contagious
            </span>
          )}
          {disease.zoonotic && (
            <span className='inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'>
              <AlertTriangle className='h-3 w-3' /> Zoonotic
            </span>
          )}
          {disease.emergencyCall && (
            <span className='inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400'>
              <Phone className='h-3 w-3' /> Emergency
            </span>
          )}
        </div>

        {/* Symptoms preview */}
        <div className='mb-3 text-sm text-gray-600 dark:text-slate-300'>
          <span className='font-medium'>Key symptoms: </span>
          {disease.symptoms.slice(0, 2).join(', ')}
          {disease.symptoms.length > 2 && '...'}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between border-t pt-3 dark:border-slate-700'>
          <span className='text-xs text-gray-500 dark:text-slate-400'>
            Mortality: {disease.mortality}
          </span>
          <span className='flex items-center gap-1 text-sm font-medium text-emerald-600'>
            View Details <ChevronRight className='h-4 w-4' />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Disease Detail Modal
function DiseaseDetail({ disease, onClose }: { disease: Disease; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'symptoms' | 'prevention' | 'treatment' | 'medicines'>(
    'symptoms'
  );
  const severity = severityConfig[disease.severity];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className='max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800'
      >
        {/* Header */}
        <div className={`${severity.bg} p-6`}>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-4'>
              <span className='text-4xl'>{disease.icon}</span>
              <div>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>{disease.name}</h2>
                {disease.nickname && (
                  <p className='text-gray-600 dark:text-slate-300'>
                    &quot;{disease.nickname}&quot;
                  </p>
                )}
                {disease.localName && (
                  <p className='text-sm text-gray-500 dark:text-slate-400'>
                    Local: {disease.localName}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className='rounded-full p-2 transition-colors hover:bg-black/10'
            >
              <XCircle className='h-6 w-6' />
            </button>
          </div>

          {/* Quick Info Cards */}
          <div className='mt-4 grid grid-cols-2 gap-3 md:grid-cols-4'>
            <div className='rounded-lg bg-white/80 p-3 text-center dark:bg-slate-900/50'>
              <p className='text-xs text-gray-500 dark:text-slate-400'>Severity</p>
              <p className={`font-bold capitalize ${severity.color}`}>{disease.severity}</p>
            </div>
            <div className='rounded-lg bg-white/80 p-3 text-center dark:bg-slate-900/50'>
              <p className='text-xs text-gray-500 dark:text-slate-400'>Mortality</p>
              <p className='font-bold text-gray-900 dark:text-white'>{disease.mortality}</p>
            </div>
            <div className='rounded-lg bg-white/80 p-3 text-center dark:bg-slate-900/50'>
              <p className='text-xs text-gray-500 dark:text-slate-400'>Recovery</p>
              <p className='font-bold text-gray-900 dark:text-white'>
                {disease.recoveryTime || 'Varies'}
              </p>
            </div>
            <div className='rounded-lg bg-white/80 p-3 text-center dark:bg-slate-900/50'>
              <p className='text-xs text-gray-500 dark:text-slate-400'>Vaccine</p>
              <p
                className={`font-bold ${disease.vaccineAvailable ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {disease.vaccineAvailable ? 'Available' : 'None'}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className='mt-4 flex flex-wrap gap-2'>
            {disease.contagious && (
              <Badge variant='outline' className='bg-white/80'>
                <Users className='mr-1 h-3 w-3' /> Contagious
              </Badge>
            )}
            {disease.zoonotic && (
              <Badge variant='outline' className='bg-white/80'>
                <AlertTriangle className='mr-1 h-3 w-3' /> Spreads to Humans
              </Badge>
            )}
            {disease.emergencyCall && (
              <Badge variant='destructive'>
                <Phone className='mr-1 h-3 w-3' /> Call Vet Immediately
              </Badge>
            )}
            {disease.seasonalRisk && (
              <Badge variant='outline' className='bg-white/80'>
                <Calendar className='mr-1 h-3 w-3' /> {disease.seasonalRisk}
              </Badge>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className='flex border-b dark:border-slate-700'>
          {(['symptoms', 'prevention', 'treatment', 'medicines'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-emerald-600 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
                  : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className='max-h-[40vh] overflow-y-auto p-6'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'symptoms' && (
                <div className='space-y-3'>
                  {disease.symptoms.map((symptom, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className='flex items-start gap-3 rounded-lg bg-red-50 p-3 dark:bg-red-900/20'
                    >
                      <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-500' />
                      <span className='text-gray-700 dark:text-slate-300'>{symptom}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'prevention' && (
                <div className='space-y-3'>
                  {disease.prevention.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className='flex items-start gap-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20'
                    >
                      <Shield className='mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500' />
                      <span className='text-gray-700 dark:text-slate-300'>{tip}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'treatment' && (
                <div className='space-y-3'>
                  {disease.treatment.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className='flex items-start gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20'
                    >
                      <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white'>
                        {index + 1}
                      </span>
                      <span className='text-gray-700 dark:text-slate-300'>{step}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'medicines' && (
                <div className='space-y-3'>
                  {disease.medicines.map((med, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className='flex items-center justify-between rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20'
                    >
                      <div className='flex items-center gap-3'>
                        <Pill className='h-5 w-5 text-purple-500' />
                        <div>
                          <p className='font-medium text-gray-900 dark:text-white'>{med.name}</p>
                          <p className='text-sm text-gray-500 dark:text-slate-400'>{med.purpose}</p>
                        </div>
                      </div>
                      {med.rating && (
                        <div className='flex items-center gap-1 text-amber-500'>
                          <Star className='h-4 w-4 fill-current' />
                          <span className='font-medium'>{med.rating}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Notes */}
          {disease.notes && disease.notes.length > 0 && (
            <div className='mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20'>
              <h4 className='mb-2 flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-200'>
                <BookOpen className='h-4 w-4' /> Important Notes
              </h4>
              <ul className='space-y-1'>
                {disease.notes.map((note, index) => (
                  <li
                    key={index}
                    className='flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300'
                  >
                    <span className='text-amber-500'>•</span> {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Main Page Component
export default function DiseasesGuidePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DiseaseCategory | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<DiseaseSeverity | 'all'>('all');
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showVaccination, setShowVaccination] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  // Filter diseases
  const filteredDiseases = useMemo(() => {
    return diseases.filter(disease => {
      const matchesSearch =
        disease.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disease.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disease.localName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disease.symptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || disease.category === selectedCategory;
      const matchesSeverity = selectedSeverity === 'all' || disease.severity === selectedSeverity;

      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [searchQuery, selectedCategory, selectedSeverity]);

  // Group by category
  const groupedDiseases = useMemo(() => {
    const groups: Record<DiseaseCategory, Disease[]> = {
      viral: [],
      bacterial: [],
      parasitic: [],
      metabolic: [],
      respiratory: [],
      reproductive: [],
      skin: [],
      neonatal: [],
    };

    filteredDiseases.forEach(disease => {
      groups[disease.category].push(disease);
    });

    return groups;
  }, [filteredDiseases]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800'>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
      >
        <div className='mx-auto max-w-7xl px-4 py-12'>
          <div className='flex flex-col items-center justify-between gap-6 md:flex-row'>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className='mb-2 text-3xl font-bold md:text-4xl'
              >
                🐄 Disease Guide
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className='text-lg text-emerald-100'
              >
                Comprehensive Veterinary Reference for Cow &amp; Buffalo
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className='mt-1 text-sm text-emerald-200'
              >
                Research by MTK CODEX • 2025 Edition
              </motion.p>
            </div>

            {/* Emergency Button */}
            <motion.button
              animate={pulseAnimation}
              onClick={() => setShowEmergency(true)}
              className='flex items-center gap-2 rounded-xl bg-red-500 px-6 py-3 font-semibold text-white shadow-lg hover:bg-red-600'
            >
              <Phone className='h-5 w-5' />
              Emergency Red Flags
            </motion.button>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='mt-8 grid grid-cols-2 gap-4 md:grid-cols-4'
          >
            <div className='rounded-xl bg-white/10 p-4 text-center backdrop-blur'>
              <p className='text-3xl font-bold'>{diseases.length}</p>
              <p className='text-sm text-emerald-200'>Diseases Covered</p>
            </div>
            <div className='rounded-xl bg-white/10 p-4 text-center backdrop-blur'>
              <p className='text-3xl font-bold'>8</p>
              <p className='text-sm text-emerald-200'>Categories</p>
            </div>
            <div className='rounded-xl bg-white/10 p-4 text-center backdrop-blur'>
              <p className='text-3xl font-bold'>{recommendedProducts.length}+</p>
              <p className='text-sm text-emerald-200'>Medicines Listed</p>
            </div>
            <div className='rounded-xl bg-white/10 p-4 text-center backdrop-blur'>
              <p className='text-3xl font-bold'>{vaccinationSchedule.length}</p>
              <p className='text-sm text-emerald-200'>Vaccines Scheduled</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className='mx-auto -mt-6 max-w-7xl px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='grid grid-cols-1 gap-4 md:grid-cols-3'
        >
          <button
            onClick={() => setShowVaccination(true)}
            className='group flex items-center gap-4 rounded-xl bg-white p-4 shadow-lg transition-all hover:shadow-xl dark:bg-slate-800'
          >
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30'>
              <Calendar className='h-6 w-6' />
            </div>
            <div className='text-left'>
              <h3 className='font-semibold text-gray-900 dark:text-white'>Vaccination Schedule</h3>
              <p className='text-sm text-gray-500 dark:text-slate-400'>
                View complete vaccine calendar
              </p>
            </div>
            <ArrowRight className='ml-auto h-5 w-5 text-gray-400 transition-colors group-hover:text-emerald-500' />
          </button>

          <button
            onClick={() => setShowProducts(true)}
            className='group flex items-center gap-4 rounded-xl bg-white p-4 shadow-lg transition-all hover:shadow-xl dark:bg-slate-800'
          >
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30'>
              <Star className='h-6 w-6' />
            </div>
            <div className='text-left'>
              <h3 className='font-semibold text-gray-900 dark:text-white'>Top Products</h3>
              <p className='text-sm text-gray-500 dark:text-slate-400'>Farmer-favorite medicines</p>
            </div>
            <ArrowRight className='ml-auto h-5 w-5 text-gray-400 transition-colors group-hover:text-emerald-500' />
          </button>

          <div className='rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white shadow-lg'>
            <div className='flex items-center gap-3'>
              <Zap className='h-8 w-8' />
              <div>
                <h3 className='font-semibold'>Prevention First!</h3>
                <p className='text-sm text-amber-100'>
                  Prevention costs ₨500-1000/year. Treatment costs ₨5,000-50,000!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Prevention Tips */}
      <div className='mx-auto mt-8 max-w-7xl px-4'>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className='rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800'
        >
          <h2 className='mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white'>
            <Shield className='h-6 w-6 text-emerald-500' />6 Rules That Prevent 90% of Farm
            Emergencies
          </h2>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {preventionTips.map((tip, index) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className='rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:border-emerald-800 dark:from-emerald-900/20 dark:to-teal-900/20'
              >
                <div className='flex items-start gap-3'>
                  <span className='text-2xl'>{tip.icon}</span>
                  <div>
                    <h3 className='font-semibold text-gray-900 dark:text-white'>{tip.title}</h3>
                    <p className='mt-1 text-sm text-gray-600 dark:text-slate-300'>
                      {tip.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className='mx-auto mt-8 max-w-7xl px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800'
        >
          <div className='flex flex-col gap-4 md:flex-row'>
            {/* Search */}
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
              <Input
                placeholder='Search diseases, symptoms...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as DiseaseCategory | 'all')}
              className='rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200'
            >
              <option value='all'>All Categories</option>
              {Object.entries(diseaseCategories).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value as DiseaseSeverity | 'all')}
              className='rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200'
            >
              <option value='all'>All Severity</option>
              <option value='critical'>🔴 Critical</option>
              <option value='high'>🟠 High</option>
              <option value='moderate'>🟡 Moderate</option>
              <option value='low'>🟢 Low</option>
            </select>
          </div>

          {/* Category Pills */}
          <div className='mt-4 flex flex-wrap gap-2'>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              All ({diseases.length})
            </button>
            {Object.entries(diseaseCategories).map(([key, cat]) => {
              const count = diseases.filter(d => d.category === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as DiseaseCategory)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === key
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {cat.icon} {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Disease Grid */}
      <div className='mx-auto max-w-7xl px-4 py-8'>
        {selectedCategory === 'all' ? (
          // Show grouped by category
          Object.entries(groupedDiseases).map(([category, categoryDiseases]) => {
            if (categoryDiseases.length === 0) return null;
            const catInfo = diseaseCategories[category as DiseaseCategory];

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='mb-10'
              >
                <div className='mb-4 flex items-center gap-3'>
                  <span className='text-2xl'>{catInfo.icon}</span>
                  <div>
                    <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                      {catInfo.name}
                    </h2>
                    <p className='text-sm text-gray-500 dark:text-slate-400'>
                      {catInfo.description}
                    </p>
                  </div>
                  <Badge variant='outline' className='ml-auto'>
                    {categoryDiseases.length} diseases
                  </Badge>
                </div>

                <motion.div
                  variants={containerVariants}
                  initial='hidden'
                  animate='visible'
                  className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
                >
                  {categoryDiseases.map(disease => (
                    <DiseaseCard
                      key={disease.id}
                      disease={disease}
                      onClick={() => setSelectedDisease(disease)}
                    />
                  ))}
                </motion.div>
              </motion.div>
            );
          })
        ) : (
          // Show flat list for filtered category
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
          >
            {filteredDiseases.map(disease => (
              <DiseaseCard
                key={disease.id}
                disease={disease}
                onClick={() => setSelectedDisease(disease)}
              />
            ))}
          </motion.div>
        )}

        {filteredDiseases.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='py-12 text-center'
          >
            <Search className='mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-slate-600' />
            <h3 className='text-xl font-semibold text-gray-600 dark:text-slate-400'>
              No diseases found
            </h3>
            <p className='text-gray-500 dark:text-slate-500'>
              Try adjusting your search or filters
            </p>
          </motion.div>
        )}
      </div>

      {/* Disease Detail Modal */}
      <AnimatePresence>
        {selectedDisease && (
          <DiseaseDetail disease={selectedDisease} onClose={() => setSelectedDisease(null)} />
        )}
      </AnimatePresence>

      {/* Emergency Red Flags Modal */}
      <AnimatePresence>
        {showEmergency && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
            onClick={() => setShowEmergency(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800'
            >
              <div className='mb-4 flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30'>
                  <Phone className='h-6 w-6 text-red-600' />
                </div>
                <div>
                  <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                    🚨 Call Vet Immediately
                  </h2>
                  <p className='text-sm text-gray-500 dark:text-slate-400'>
                    If you see any of these signs
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                {emergencyRedFlags.map((flag, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className='flex items-center gap-3 rounded-lg bg-red-50 p-3 dark:bg-red-900/20'
                  >
                    <AlertTriangle className='h-5 w-5 flex-shrink-0 text-red-500' />
                    <span className='text-gray-700 dark:text-slate-300'>{flag}</span>
                  </motion.div>
                ))}
              </div>

              <Button
                onClick={() => setShowEmergency(false)}
                className='mt-6 w-full bg-red-500 hover:bg-red-600'
              >
                Got It
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vaccination Schedule Modal */}
      <AnimatePresence>
        {showVaccination && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
            onClick={() => setShowVaccination(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className='max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800'
            >
              <div className='border-b p-6 dark:border-slate-700'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30'>
                    <Calendar className='h-6 w-6 text-blue-600' />
                  </div>
                  <div>
                    <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                      📋 Vaccination Schedule
                    </h2>
                    <p className='text-sm text-gray-500 dark:text-slate-400'>
                      Paste on shed wall - Follow strictly
                    </p>
                  </div>
                </div>
              </div>

              <div className='max-h-[60vh] overflow-y-auto p-6'>
                <div className='space-y-3'>
                  {vaccinationSchedule.map((schedule, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className='flex items-center gap-4 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20'
                    >
                      <div className='w-20 text-center'>
                        <span className='text-xs font-medium text-blue-600 dark:text-blue-400'>
                          {schedule.age}
                        </span>
                      </div>
                      <div className='flex-1'>
                        <p className='font-medium text-gray-900 dark:text-white'>
                          {schedule.vaccine}
                        </p>
                        <p className='text-sm text-gray-500 dark:text-slate-400'>
                          {schedule.disease}
                        </p>
                      </div>
                      {schedule.frequency && (
                        <Badge variant='outline' className='text-xs'>
                          {schedule.frequency}
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className='mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20'>
                  <p className='text-sm font-medium text-emerald-700 dark:text-emerald-300'>
                    💡 Pro Tip: Use FREE government vaccines from NADCP centers for FMD, HS+BQ, and
                    Brucellosis!
                  </p>
                </div>
              </div>

              <div className='border-t p-4 dark:border-slate-700'>
                <Button
                  onClick={() => setShowVaccination(false)}
                  className='w-full bg-blue-500 hover:bg-blue-600'
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommended Products Modal */}
      <AnimatePresence>
        {showProducts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
            onClick={() => setShowProducts(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className='max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800'
            >
              <div className='border-b p-6 dark:border-slate-700'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30'>
                    <Star className='h-6 w-6 text-purple-600' />
                  </div>
                  <div>
                    <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                      🏆 Farmer-Favorite Products
                    </h2>
                    <p className='text-sm text-gray-500 dark:text-slate-400'>
                      Tested and trusted by thousands of farmers
                    </p>
                  </div>
                </div>
              </div>

              <div className='max-h-[60vh] overflow-y-auto p-6'>
                {[
                  'Calcium',
                  'Minerals',
                  'Liver Tonic',
                  'Bypass Fat',
                  'Tick Control',
                  'Respiratory',
                  'Calf Care',
                  'Mastitis',
                ].map(category => {
                  const categoryProducts = recommendedProducts.filter(p => p.category === category);
                  if (categoryProducts.length === 0) return null;

                  return (
                    <div key={category} className='mb-6'>
                      <h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400'>
                        {category}
                      </h3>
                      <div className='space-y-2'>
                        {categoryProducts.map((product, index) => (
                          <motion.div
                            key={product.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className='flex items-center justify-between rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20'
                          >
                            <div className='flex items-center gap-3'>
                              <Pill className='h-4 w-4 text-purple-500' />
                              <div>
                                <p className='font-medium text-gray-900 dark:text-white'>
                                  {product.name}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-slate-400'>
                                  {product.purpose}
                                </p>
                              </div>
                            </div>
                            <div className='flex items-center gap-1 text-amber-500'>
                              <Star className='h-4 w-4 fill-current' />
                              <span className='text-sm font-medium'>{product.rating}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className='mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20'>
                  <p className='text-sm text-amber-700 dark:text-amber-300'>
                    ⚠️ Only buy from registered veterinary pharmacies. Avoid online sellers without
                    license.
                  </p>
                </div>
              </div>

              <div className='border-t p-4 dark:border-slate-700'>
                <Button
                  onClick={() => setShowProducts(false)}
                  className='w-full bg-purple-500 hover:bg-purple-600'
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className='mt-12 bg-slate-900 py-8 text-white'>
        <div className='mx-auto max-w-7xl px-4 text-center'>
          <p className='mb-2 text-lg font-semibold'>
            Remember: Prevention costs ₨500-1000 per year.
          </p>
          <p className='mb-4 text-slate-400'>
            Treatment costs ₨5,000-50,000 and animal may still die.
          </p>
          <p className='font-medium text-emerald-400'>
            Prevention is ALWAYS cheaper than cure! 🐄💚
          </p>
          <p className='mt-4 text-xs text-slate-500'>
            Research by MTK CODEX • Share this guide with fellow farmers
          </p>
        </div>
      </footer>
    </div>
  );
}
