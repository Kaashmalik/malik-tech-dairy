'use client';

import { motion } from 'framer-motion';
import {
  Phone,
  Mail,
  MessageCircle,
  HelpCircle,
  Stethoscope,
  BookOpen,
  Youtube,
  FileText,
  Clock,
  MapPin,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Star,
  Users,
  Sparkles,
  Shield,
  Heart,
  Bug,
  Milk,
  Beef,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const WHATSAPP_NUMBER = '923038111297';
const TEAM_NAME = 'MTK Dairy Team';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const supportChannels = [
  {
    id: 'whatsapp',
    title: 'WhatsApp Support',
    subtitle: 'Fastest response - Available 24/7',
    description: 'Chat directly with our support team for quick assistance',
    icon: MessageCircle,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    action: () => {
      const message = encodeURIComponent(
        `Assalam o Alaikum ${TEAM_NAME}!\n\nI need help with MTK Dairy App.\n\n*My Question:*\n[Please type your question here]\n\nJazakAllah!`
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    },
    actionLabel: 'Chat Now',
    responseTime: '< 5 minutes',
    available: true,
  },
  {
    id: 'vet',
    title: 'Veterinary Doctor',
    subtitle: 'Expert animal health guidance',
    description: 'Get professional veterinary advice for your livestock',
    icon: Stethoscope,
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    action: () => {
      const message = encodeURIComponent(
        `Assalam o Alaikum ${TEAM_NAME}!\n\n🚨 I need URGENT veterinary help!\n\n*Animal Details:*\n- Type: [Cow/Buffalo/Other]\n- Age: [Years/Months]\n- Symptoms: [Describe symptoms]\n- Duration: [How long?]\n\nPlease advise ASAP. JazakAllah!`
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    },
    actionLabel: 'Get Vet Help',
    responseTime: '< 10 minutes',
    available: true,
    highlight: true,
  },
  {
    id: 'phone',
    title: 'Phone Support',
    subtitle: 'Direct call for urgent matters',
    description: 'Call us directly for critical issues',
    icon: Phone,
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    action: () => {
      window.open('tel:+923038111297', '_self');
    },
    actionLabel: 'Call Now',
    phoneNumber: '0303-8111297',
    available: true,
  },
  {
    id: 'email',
    title: 'Email Support',
    subtitle: 'For detailed inquiries',
    description: 'Send us detailed questions or suggestions',
    icon: Mail,
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    action: () => {
      window.open('mailto:support@maliktechdairy.com?subject=MTK Dairy Support Request', '_blank');
    },
    actionLabel: 'Send Email',
    responseTime: '< 24 hours',
    available: true,
  },
];

const quickLinks = [
  {
    title: 'Disease Guide',
    description: 'Comprehensive veterinary reference',
    icon: Bug,
    href: '/diseases',
    color: 'text-red-500',
  },
  {
    title: 'Medicine Management',
    description: 'Track your medicine inventory',
    icon: Heart,
    href: '/medicine',
    color: 'text-emerald-500',
  },
  {
    title: 'Animal Management',
    description: 'Manage your livestock records',
    icon: Beef,
    href: '/animals',
    color: 'text-amber-500',
  },
  {
    title: 'Milk Records',
    description: 'Track milk production',
    icon: Milk,
    href: '/milk',
    color: 'text-blue-500',
  },
];

const faqItems = [
  {
    question: 'How do I add a new animal to my farm?',
    answer: 'Go to Animals page and click "Add Animal". Fill in the details like tag number, species, breed, and date of birth. You can also upload a photo.',
  },
  {
    question: 'How can I track my milk production?',
    answer: 'Navigate to the Milk page and click "Log Milk". Record the quantity, session (morning/evening), and quality rating for each milking.',
  },
  {
    question: 'What should I do in case of animal emergency?',
    answer: 'Use the WhatsApp button to contact our vet team immediately. Select "Veterinary Doctor" for urgent health guidance. You can also call us directly at 0303-8111297.',
  },
  {
    question: 'How do I upgrade my subscription plan?',
    answer: 'Go to Subscription page to view available plans. Select your desired plan and complete the payment. Your account will be upgraded immediately.',
  },
  {
    question: 'Can I add staff members to my farm account?',
    answer: 'Yes! Go to Staff page from the settings menu. You can invite staff with different roles like Manager, Worker, or Viewer.',
  },
  {
    question: 'How do I generate reports for my farm?',
    answer: 'Visit the Analytics page and click on "Generate Report". Select the date range and report type (Animals, Milk, Health, or Financial).',
  },
];

export default function HelpPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 p-6"
    >
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-8 text-white shadow-xl"
      >
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <HelpCircle className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Help & Support</h1>
              <p className="text-emerald-100">We&apos;re here to help you 24/7</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-white/15 p-4 text-center backdrop-blur">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-sm text-emerald-100">Support Available</p>
            </div>
            <div className="rounded-xl bg-white/15 p-4 text-center backdrop-blur">
              <p className="text-2xl font-bold">&lt; 5min</p>
              <p className="text-sm text-emerald-100">Response Time</p>
            </div>
            <div className="rounded-xl bg-white/15 p-4 text-center backdrop-blur">
              <p className="text-2xl font-bold">500+</p>
              <p className="text-sm text-emerald-100">Farms Supported</p>
            </div>
            <div className="rounded-xl bg-white/15 p-4 text-center backdrop-blur">
              <p className="text-2xl font-bold">4.9★</p>
              <p className="text-sm text-emerald-100">User Rating</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Support Channels */}
      <div>
        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <MessageCircle className="h-6 w-6 text-emerald-500" />
          Contact Support
        </h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2"
        >
          {supportChannels.map((channel) => (
            <motion.div
              key={channel.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`group relative overflow-hidden rounded-xl border ${
                channel.highlight 
                  ? 'border-red-200 dark:border-red-800' 
                  : 'border-gray-200/50 dark:border-slate-700'
              } bg-white shadow-sm transition-all hover:shadow-lg dark:bg-slate-800`}
            >
              {channel.highlight && (
                <div className="absolute right-0 top-0 rounded-bl-lg bg-red-500 px-3 py-1 text-xs font-bold text-white">
                  URGENT
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`rounded-xl bg-gradient-to-br ${channel.color} p-3 text-white shadow-lg`}>
                    <channel.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{channel.title}</h3>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">{channel.subtitle}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{channel.description}</p>
                    
                    {channel.responseTime && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                        <Clock className="h-3 w-3" />
                        Response: {channel.responseTime}
                      </div>
                    )}
                    
                    {channel.phoneNumber && (
                      <div className="mt-2 flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                        <Phone className="h-4 w-4" />
                        {channel.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={channel.action}
                  className={`mt-4 w-full bg-gradient-to-r ${channel.color} text-white shadow-lg hover:opacity-90`}
                >
                  {channel.actionLabel}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <Sparkles className="h-6 w-6 text-amber-500" />
          Quick Links
        </h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-4"
        >
          {quickLinks.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="group flex items-center gap-4 rounded-xl border border-gray-200/50 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              <div className={`rounded-lg bg-gray-100 p-3 dark:bg-slate-700 ${link.color}`}>
                <link.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{link.title}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">{link.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
            </motion.a>
          ))}
        </motion.div>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <BookOpen className="h-6 w-6 text-purple-500" />
          Frequently Asked Questions
        </h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {faqItems.map((faq, index) => (
            <motion.details
              key={index}
              variants={itemVariants}
              className="group rounded-xl border border-gray-200/50 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-gray-900 dark:text-white">
                <span className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                    {index + 1}
                  </span>
                  {faq.question}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t px-4 py-3 text-gray-600 dark:border-slate-700 dark:text-slate-300">
                {faq.answer}
              </div>
            </motion.details>
          ))}
        </motion.div>
      </div>

      {/* About MTK Dairy Team */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-gray-200/50 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 dark:border-slate-700 dark:from-emerald-900/20 dark:to-teal-900/20"
      >
        <div className="flex flex-col items-center text-center md:flex-row md:text-left">
          <div className="mb-4 md:mb-0 md:mr-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl text-white shadow-lg">
              🐄
            </div>
          </div>
          <div className="flex-1">
            <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              {TEAM_NAME}
            </h3>
            <p className="mb-4 text-gray-600 dark:text-slate-300">
              We&apos;re a passionate team of dairy farming experts, veterinarians, and technologists 
              dedicated to empowering farmers across Pakistan with modern dairy management tools.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:justify-start">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                <MapPin className="h-4 w-4 text-emerald-500" />
                Pakistan
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                <Phone className="h-4 w-4 text-emerald-500" />
                0303-8111297
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                <Clock className="h-4 w-4 text-emerald-500" />
                24/7 Support
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => {
              const message = encodeURIComponent(`Assalam o Alaikum ${TEAM_NAME}!\n\nI need assistance.\n\nJazakAllah!`);
              window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
            }}
            className="bg-green-500 text-white hover:bg-green-600"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('tel:+923038111297', '_self')}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <Phone className="mr-2 h-4 w-4" />
            Call Us
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

