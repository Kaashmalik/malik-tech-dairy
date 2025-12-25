'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  FileText,
  Download,
  Calendar,
  Beef,
  Milk,
  Heart,
  DollarSign,
  Loader2,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  PieChart,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  color: string;
  gradient: string;
  features: string[];
}

const reportTypes: ReportType[] = [
  {
    id: 'animals',
    title: 'Animal Report',
    description: 'Complete livestock inventory and status overview',
    icon: Beef,
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 to-teal-600',
    features: ['Animal inventory', 'Species distribution', 'Age groups', 'Health status'],
  },
  {
    id: 'milk',
    title: 'Milk Production Report',
    description: 'Detailed milk production and quality analysis',
    icon: Milk,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-cyan-600',
    features: ['Daily production', 'Quality metrics', 'Session analysis', 'Trends'],
  },
  {
    id: 'health',
    title: 'Health Report',
    description: 'Vaccinations, treatments, and health records',
    icon: Heart,
    color: 'text-red-600',
    gradient: 'from-red-500 to-rose-600',
    features: ['Vaccination records', 'Treatment history', 'Health alerts', 'Vet visits'],
  },
  {
    id: 'financial',
    title: 'Financial Report',
    description: 'Revenue, expenses, and profitability analysis',
    icon: DollarSign,
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-violet-600',
    features: ['Revenue summary', 'Expense breakdown', 'Profit margins', 'Cost analysis'],
  },
];

const quickDateRanges = [
  { label: 'Today', getValue: () => ({ start: new Date(), end: new Date() }) },
  { label: 'Last 7 Days', getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { label: 'Last 30 Days', getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: 'This Month', getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: 'Last Month', getValue: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Last 3 Months', getValue: () => ({ start: subMonths(new Date(), 3), end: new Date() }) },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface GeneratedReport {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  status: 'completed' | 'generating' | 'failed';
}

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentReports, setRecentReports] = useState<GeneratedReport[]>([]);

  const handleQuickDateSelect = (range: (typeof quickDateRanges)[0]) => {
    const { start, end } = range.getValue();
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const handleGenerateReport = async () => {
    if (!selectedType) {
      toast.error('Please select a report type');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${selectedType}-${startDate}-${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Add to recent reports
      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        type: selectedType,
        startDate,
        endDate,
        generatedAt: new Date().toISOString(),
        status: 'completed',
      };
      setRecentReports([newReport, ...recentReports.slice(0, 4)]);

      toast.success('Report generated and downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedReportType = reportTypes.find((r) => r.id === selectedType);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 p-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            Reports & Analytics
          </h1>
          <p className="mt-1 text-gray-600 dark:text-slate-400">
            Generate comprehensive reports for your farm data
          </p>
        </div>
      </motion.div>

      {/* Report Type Selection */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Select Report Type
        </h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {reportTypes.map((report) => (
            <motion.div
              key={report.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedType(report.id)}
              className={`group cursor-pointer overflow-hidden rounded-xl border transition-all ${
                selectedType === report.id
                  ? 'border-emerald-500 bg-emerald-50 shadow-lg dark:border-emerald-400 dark:bg-emerald-900/20'
                  : 'border-gray-200/50 bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-800'
              }`}
            >
              <div className={`h-1 bg-gradient-to-r ${report.gradient}`} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl bg-gradient-to-br ${report.gradient} p-3 text-white shadow-md`}>
                    <report.icon className="h-5 w-5" />
                  </div>
                  {selectedType === report.id && (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  )}
                </div>
                <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">{report.title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{report.description}</p>
                
                <div className="mt-4 flex flex-wrap gap-1">
                  {report.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Date Range Selection */}
      <AnimatePresence>
        {selectedType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className={`h-5 w-5 ${selectedReportType?.color}`} />
                  Select Date Range
                </CardTitle>
                <CardDescription>
                  Choose the time period for your {selectedReportType?.title.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Date Selectors */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Quick Select
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {quickDateRanges.map((range) => (
                      <Button
                        key={range.label}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickDateSelect(range)}
                        className="border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Range */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-4 dark:from-slate-700/50 dark:to-slate-700/30">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Ready to generate {selectedReportType?.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className={`bg-gradient-to-r ${selectedReportType?.gradient} text-white shadow-lg`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Generate PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Reports */}
      {recentReports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Recently Generated
          </h2>
          <Card>
            <CardContent className="divide-y p-0 dark:divide-slate-700">
              {recentReports.map((report) => {
                const reportType = reportTypes.find((r) => r.id === report.type);
                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`rounded-lg bg-gradient-to-br ${reportType?.gradient || 'from-gray-500 to-gray-600'} p-2 text-white`}>
                        {reportType ? <reportType.icon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {reportType?.title || 'Report'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {format(new Date(report.startDate), 'MMM d')} - {format(new Date(report.endDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                        <Clock className="h-3 w-3" />
                        {format(new Date(report.generatedAt), 'h:mm a')}
                      </div>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Completed
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State when no report type selected */}
      {!selectedType && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-12 text-center dark:border-slate-700"
        >
          <div className="rounded-full bg-purple-100 p-4 dark:bg-purple-900/30">
            <FileSpreadsheet className="h-10 w-10 text-purple-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Select a Report Type
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Choose one of the report types above to get started
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
