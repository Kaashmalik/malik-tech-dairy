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
  Lung,
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
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity }
};

// Severity colors and icons
const severityConfig: Record<DiseaseSeverity, { color: string; bg: string; icon: React.ReactNode }> = {
  critical: { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', icon: <Skull className="w-4 h-4" /> },
  high: { color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', icon: <AlertTriangle className="w-4 h-4" /> },
  moderate: { color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: <AlertCircle className="w-4 h-4" /> },
  low: { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', icon: <CheckCircle2 className="w-4 h-4" /> },
};

// Category icons
const categoryIcons: Record<DiseaseCategory, React.ReactNode> = {
  viral: <Bug className="w-5 h-5" />,
  bacterial: <Stethoscope className="w-5 h-5" />,
  parasitic: <Bug className="w-5 h-5" />,
  metabolic: <Heart className="w-5 h-5" />,
  respiratory: <Lung className="w-5 h-5" />,
  reproductive: <Users className="w-5 h-5" />,
  skin: <Eye className="w-5 h-5" />,
  neonatal: <Baby className="w-5 h-5" />,
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
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-100 dark:border-slate-700 overflow-hidden"
    >
      {/* Severity indicator bar */}
      <div className={`h-1 ${severity.bg.replace('bg-', 'bg-').replace('/30', '')}`} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{disease.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {disease.name}
              </h3>
              {disease.nickname && (
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  &quot;{disease.nickname}&quot;
                </p>
              )}
            </div>
          </div>
          <Badge className={`${severity.bg} ${severity.color} border-0`}>
            {disease.severity}
          </Badge>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-2 mb-3">
          {disease.vaccineAvailable && (
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">
              <Syringe className="w-3 h-3" /> Vaccine
            </span>
          )}
          {disease.contagious && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
              <Users className="w-3 h-3" /> Contagious
            </span>
          )}
          {disease.zoonotic && (
            <span className="inline-flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" /> Zoonotic
            </span>
          )}
          {disease.emergencyCall && (
            <span className="inline-flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full">
              <Phone className="w-3 h-3" /> Emergency
            </span>
          )}
        </div>

        {/* Symptoms preview */}
        <div className="text-sm text-gray-600 dark:text-slate-300 mb-3">
          <span className="font-medium">Key symptoms: </span>
          {disease.symptoms.slice(0, 2).join(', ')}
          {disease.symptoms.length > 2 && '...'}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t dark:border-slate-700">
          <span className="text-xs text-gray-500 dark:text-slate-400">
            Mortality: {disease.mortality}
          </span>
          <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
            View Details <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Disease Detail Modal
function DiseaseDetail({ disease, onClose }: { disease: Disease; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'symptoms' | 'prevention' | 'treatment' | 'medicines'>('symptoms');
  const severity = severityConfig[disease.severity];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className={`${severity.bg} p-6`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{disease.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {disease.name}
                </h2>
                {disease.nickname && (
                  <p className="text-gray-600 dark:text-slate-300">&quot;{disease.nickname}&quot;</p>
                )}
                {disease.localName && (
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Local: {disease.localName}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/10 rounded-full transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-white/80 dark:bg-slate-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-slate-400">Severity</p>
              <p className={`font-bold capitalize ${severity.color}`}>{disease.severity}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-slate-400">Mortality</p>
              <p className="font-bold text-gray-900 dark:text-white">{disease.mortality}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-slate-400">Recovery</p>
              <p className="font-bold text-gray-900 dark:text-white">{disease.recoveryTime || 'Varies'}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-slate-400">Vaccine</p>
              <p className={`font-bold ${disease.vaccineAvailable ? 'text-emerald-600' : 'text-red-600'}`}>
                {disease.vaccineAvailable ? 'Available' : 'None'}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {disease.contagious && (
              <Badge variant="outline" className="bg-white/80">
                <Users className="w-3 h-3 mr-1" /> Contagious
              </Badge>
            )}
            {disease.zoonotic && (
              <Badge variant="outline" className="bg-white/80">
                <AlertTriangle className="w-3 h-3 mr-1" /> Spreads to Humans
              </Badge>
            )}
            {disease.emergencyCall && (
              <Badge variant="destructive">
                <Phone className="w-3 h-3 mr-1" /> Call Vet Immediately
              </Badge>
            )}
            {disease.seasonalRisk && (
              <Badge variant="outline" className="bg-white/80">
                <Calendar className="w-3 h-3 mr-1" /> {disease.seasonalRisk}
              </Badge>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-slate-700">
          {(['symptoms', 'prevention', 'treatment', 'medicines'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'text-gray-500 hover:text-gray-700 dark:text-slate-400'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[40vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'symptoms' && (
                <div className="space-y-3">
                  {disease.symptoms.map((symptom, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-slate-300">{symptom}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'prevention' && (
                <div className="space-y-3">
                  {disease.prevention.map((tip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"
                    >
                      <Shield className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-slate-300">{tip}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'treatment' && (
                <div className="space-y-3">
                  {disease.treatment.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                    >
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 dark:text-slate-300">{step}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'medicines' && (
                <div className="space-y-3">
                  {disease.medicines.map((med, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Pill className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{med.name}</p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">{med.purpose}</p>
                        </div>
                      </div>
                      {med.rating && (
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-medium">{med.rating}</span>
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
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Important Notes
              </h4>
              <ul className="space-y-1">
                {disease.notes.map((note, index) => (
                  <li key={index} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <span className="text-amber-500">•</span> {note}
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
    return diseases.filter((disease) => {
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

    filteredDiseases.forEach((disease) => {
      groups[disease.category].push(disease);
    });

    return groups;
  }, [filteredDiseases]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl md:text-4xl font-bold mb-2"
              >
                🐄 Disease Guide
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-emerald-100 text-lg"
              >
                Comprehensive Veterinary Reference for Cow &amp; Buffalo
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-emerald-200 text-sm mt-1"
              >
                Research by MTK CODEX • 2025 Edition
              </motion.p>
            </div>

            {/* Emergency Button */}
            <motion.button
              animate={pulseAnimation}
              onClick={() => setShowEmergency(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg"
            >
              <Phone className="w-5 h-5" />
              Emergency Red Flags
            </motion.button>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
          >
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{diseases.length}</p>
              <p className="text-emerald-200 text-sm">Diseases Covered</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">8</p>
              <p className="text-emerald-200 text-sm">Categories</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{recommendedProducts.length}+</p>
              <p className="text-emerald-200 text-sm">Medicines Listed</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{vaccinationSchedule.length}</p>
              <p className="text-emerald-200 text-sm">Vaccines Scheduled</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <button
            onClick={() => setShowVaccination(true)}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">Vaccination Schedule</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">View complete vaccine calendar</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors ml-auto" />
          </button>

          <button
            onClick={() => setShowProducts(true)}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600">
              <Star className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">Top Products</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">Farmer-favorite medicines</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors ml-auto" />
          </button>

          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 shadow-lg text-white">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8" />
              <div>
                <h3 className="font-semibold">Prevention First!</h3>
                <p className="text-sm text-amber-100">
                  Prevention costs ₨500-1000/year. Treatment costs ₨5,000-50,000!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Prevention Tips */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-500" />
            6 Rules That Prevent 90% of Farm Emergencies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preventionTips.map((tip, index) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tip.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{tip.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">{tip.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search diseases, symptoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as DiseaseCategory | 'all')}
              className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200"
            >
              <option value="all">All Categories</option>
              {Object.entries(diseaseCategories).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as DiseaseSeverity | 'all')}
              className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200"
            >
              <option value="all">All Severity</option>
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High</option>
              <option value="moderate">🟡 Moderate</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
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
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedCategory === key
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
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
      <div className="max-w-7xl mx-auto px-4 py-8">
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
                className="mb-10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{catInfo.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {catInfo.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {catInfo.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {categoryDiseases.length} diseases
                  </Badge>
                </div>
                
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {categoryDiseases.map((disease) => (
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
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredDiseases.map((disease) => (
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
            className="text-center py-12"
          >
            <Search className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-slate-400">
              No diseases found
            </h3>
            <p className="text-gray-500 dark:text-slate-500">
              Try adjusting your search or filters
            </p>
          </motion.div>
        )}
      </div>

      {/* Disease Detail Modal */}
      <AnimatePresence>
        {selectedDisease && (
          <DiseaseDetail
            disease={selectedDisease}
            onClose={() => setSelectedDisease(null)}
          />
        )}
      </AnimatePresence>

      {/* Emergency Red Flags Modal */}
      <AnimatePresence>
        {showEmergency && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEmergency(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    🚨 Call Vet Immediately
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    If you see any of these signs
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {emergencyRedFlags.map((flag, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-slate-300">{flag}</span>
                  </motion.div>
                ))}
              </div>

              <Button
                onClick={() => setShowEmergency(false)}
                className="w-full mt-6 bg-red-500 hover:bg-red-600"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowVaccination(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      📋 Vaccination Schedule
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Paste on shed wall - Follow strictly
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-3">
                  {vaccinationSchedule.map((schedule, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
                    >
                      <div className="w-20 text-center">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {schedule.age}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {schedule.vaccine}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {schedule.disease}
                        </p>
                      </div>
                      {schedule.frequency && (
                        <Badge variant="outline" className="text-xs">
                          {schedule.frequency}
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                    💡 Pro Tip: Use FREE government vaccines from NADCP centers for FMD, HS+BQ, and Brucellosis!
                  </p>
                </div>
              </div>

              <div className="p-4 border-t dark:border-slate-700">
                <Button
                  onClick={() => setShowVaccination(false)}
                  className="w-full bg-blue-500 hover:bg-blue-600"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowProducts(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      🏆 Farmer-Favorite Products
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Tested and trusted by thousands of farmers
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {['Calcium', 'Minerals', 'Liver Tonic', 'Bypass Fat', 'Tick Control', 'Respiratory', 'Calf Care', 'Mastitis'].map((category) => {
                  const categoryProducts = recommendedProducts.filter(p => p.category === category);
                  if (categoryProducts.length === 0) return null;
                  
                  return (
                    <div key={category} className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {categoryProducts.map((product, index) => (
                          <motion.div
                            key={product.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Pill className="w-4 h-4 text-purple-500" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">{product.purpose}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium">{product.rating}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    ⚠️ Only buy from registered veterinary pharmacies. Avoid online sellers without license.
                  </p>
                </div>
              </div>

              <div className="p-4 border-t dark:border-slate-700">
                <Button
                  onClick={() => setShowProducts(false)}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-lg font-semibold mb-2">
            Remember: Prevention costs ₨500-1000 per year.
          </p>
          <p className="text-slate-400 mb-4">
            Treatment costs ₨5,000-50,000 and animal may still die.
          </p>
          <p className="text-emerald-400 font-medium">
            Prevention is ALWAYS cheaper than cure! 🐄💚
          </p>
          <p className="text-xs text-slate-500 mt-4">
            Research by MTK CODEX • Share this guide with fellow farmers
          </p>
        </div>
      </footer>
    </div>
  );
}
