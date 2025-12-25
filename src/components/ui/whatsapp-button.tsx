'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Phone, Stethoscope, HelpCircle, ChevronUp } from 'lucide-react';

interface ContactOption {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  message: string;
}

const WHATSAPP_NUMBER = '923038111297'; // Pakistan format without +
const TEAM_NAME = 'MTK Dairy Team';

const contactOptions: ContactOption[] = [
  {
    id: 'vet',
    title: 'Veterinary Doctor',
    subtitle: 'Animal health emergency',
    icon: <Stethoscope className='h-5 w-5' />,
    message: `Assalam o Alaikum ${TEAM_NAME}!\n\nI need urgent veterinary guidance for my animal.\n\n*Issue Details:*\n- Animal Type: [Cow/Buffalo/Other]\n- Symptoms: [Describe symptoms]\n- Duration: [How long?]\n\nPlease advise. JazakAllah!`,
  },
  {
    id: 'technical',
    title: 'Technical Support',
    subtitle: 'App or dashboard issues',
    icon: <HelpCircle className='h-5 w-5' />,
    message: `Assalam o Alaikum ${TEAM_NAME}!\n\nI need technical support with MTK Dairy App.\n\n*Issue Details:*\n- Problem: [Describe your issue]\n- Farm ID: [Your Farm ID]\n\nPlease help. JazakAllah!`,
  },
  {
    id: 'general',
    title: 'General Inquiry',
    subtitle: 'Questions & feedback',
    icon: <MessageCircle className='h-5 w-5' />,
    message: `Assalam o Alaikum ${TEAM_NAME}!\n\nI have a question about MTK Dairy services.\n\n*My Question:*\n[Type your question here]\n\nJazakAllah!`,
  },
];

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const openWhatsApp = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop when menu is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-40 bg-black/20 backdrop-blur-sm'
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main container */}
      <div className='fixed bottom-6 right-6 z-50'>
        {/* Contact Options Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className='absolute bottom-20 right-0 w-72 overflow-hidden rounded-2xl border border-gray-200/50 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800'
            >
              {/* Header */}
              <div className='bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-white/20'>
                    <Phone className='h-5 w-5' />
                  </div>
                  <div>
                    <h3 className='font-bold'>{TEAM_NAME}</h3>
                    <p className='text-xs text-green-100'>We&apos;re here to help 24/7</p>
                  </div>
                </div>
              </div>

              {/* Contact Options */}
              <div className='divide-y divide-gray-100 dark:divide-slate-700'>
                {contactOptions.map((option, index) => (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => openWhatsApp(option.message)}
                    className='group flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-green-50 dark:hover:bg-green-900/20'
                  >
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 transition-all group-hover:scale-110 group-hover:bg-green-500 group-hover:text-white dark:bg-green-900/30 dark:text-green-400'>
                      {option.icon}
                    </div>
                    <div className='flex-1'>
                      <p className='font-medium text-gray-900 dark:text-white'>{option.title}</p>
                      <p className='text-xs text-gray-500 dark:text-slate-400'>{option.subtitle}</p>
                    </div>
                    <ChevronUp className='h-4 w-4 rotate-90 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-green-500' />
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className='bg-gray-50 px-4 py-3 text-center dark:bg-slate-700/50'>
                <p className='text-xs text-gray-500 dark:text-slate-400'>
                  📞 03038111297 • Available 24/7
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main WhatsApp Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`group relative flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
            isOpen
              ? 'bg-gray-700 shadow-gray-700/30'
              : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/40'
          }`}
        >
          {/* Pulse animation ring */}
          {!isOpen && (
            <motion.span
              className='absolute inset-0 rounded-full bg-green-500'
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Icon */}
          <AnimatePresence mode='wait'>
            {isOpen ? (
              <motion.div
                key='close'
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className='h-7 w-7 text-white' />
              </motion.div>
            ) : (
              <motion.div
                key='whatsapp'
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* WhatsApp SVG Icon */}
                <svg
                  viewBox='0 0 32 32'
                  fill='white'
                  className='h-8 w-8'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M16 2C8.28 2 2 8.28 2 16c0 2.47.64 4.79 1.76 6.81L2 30l7.39-1.94A14.02 14.02 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm7.41 19.59c-.31.86-1.82 1.64-2.52 1.75-.7.11-1.58.16-2.55-.16-.59-.2-1.34-.45-2.3-.88-4.04-1.81-6.68-5.94-6.88-6.22-.2-.28-1.64-2.18-1.64-4.17 0-1.99 1.04-2.97 1.41-3.38.37-.41.81-.51 1.08-.51.27 0 .54 0 .78.01.25.01.58-.09.91.7.33.79 1.12 2.73 1.22 2.93.1.2.17.43.03.7-.14.27-.21.44-.42.68-.21.24-.44.53-.63.71-.21.2-.43.42-.18.82.25.4 1.1 1.81 2.36 2.93 1.62 1.44 2.99 1.89 3.41 2.1.42.21.67.17.91-.1.24-.27 1.04-1.21 1.32-1.63.28-.42.56-.35.94-.21.38.14 2.42 1.14 2.83 1.35.41.21.69.31.79.49.1.17.1 1.01-.21 1.99z' />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tooltip */}
          <AnimatePresence>
            {isHovered && !isOpen && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className='absolute right-full mr-3 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow-lg'
              >
                <span>Need Help? Chat with us!</span>
                <div className='absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-gray-900' />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Notification dot */}
        {!isOpen && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg'
          >
            1
          </motion.span>
        )}
      </div>
    </>
  );
}

