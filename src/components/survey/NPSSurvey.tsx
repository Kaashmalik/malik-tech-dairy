'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { usePostHogAnalytics } from '@/hooks/usePostHog';
import { useAuth } from '@clerk/nextjs';

interface NPSSurveyProps {
  onClose?: () => void;
  autoShow?: boolean; // Auto-show after 7 days
}

export function NPSSurvey({ onClose, autoShow = false }: NPSSurveyProps) {
  const t = useTranslations('nps');
  const { trackEvent } = usePostHogAnalytics();
  const { userId } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [show, setShow] = useState(false);

  // Check if user has been active for 7 days
  useEffect(() => {
    if (autoShow && userId) {
      const lastSurveyDate = localStorage.getItem(`nps_survey_${userId}`);
      const signupDate = localStorage.getItem(`signup_date_${userId}`);

      if (!lastSurveyDate) {
        // Check if 7 days have passed since signup
        if (signupDate) {
          const daysSinceSignup = (Date.now() - parseInt(signupDate)) / (1000 * 60 * 60 * 24);
          if (daysSinceSignup >= 7) {
            setShow(true);
          }
        } else {
          // If no signup date, set it now and show after 7 days
          localStorage.setItem(`signup_date_${userId}`, Date.now().toString());
        }
      }
    }
  }, [autoShow, userId]);

  const handleSubmit = async () => {
    if (score === null) return;

    // Track NPS event
    trackEvent('nps_survey_submitted', {
      score,
      feedback: feedback || undefined,
      category: score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor',
    });

    // Submit to API
    try {
      await fetch('/api/survey/nps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, feedback }),
      });
    } catch (error) {
      console.error('Error submitting NPS survey:', error);
    }

    // Mark as submitted
    if (userId) {
      localStorage.setItem(`nps_survey_${userId}`, Date.now().toString());
    }

    setSubmitted(true);
  };

  if (!show && !autoShow) {
    return null;
  }

  if (submitted) {
    return (
      <Card className='fixed bottom-4 right-4 z-50 w-96 shadow-lg'>
        <CardContent className='pt-6'>
          <p className='text-center font-semibold text-green-600'>{t('thankYou')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='fixed bottom-4 right-4 z-50 w-96 shadow-lg'>
      <CardHeader>
        <CardTitle className='text-lg'>{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* NPS Scale */}
        <div className='flex justify-between gap-2'>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <button
              key={num}
              onClick={() => setScore(num)}
              className={`h-12 flex-1 rounded-md border-2 transition-all ${
                score === num
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-muted'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Feedback Textarea */}
        {score !== null && (
          <div className='space-y-2'>
            <label className='text-sm font-medium'>
              {score >= 9
                ? 'What do you love most?'
                : score >= 7
                  ? 'What could we improve?'
                  : 'What went wrong? How can we fix it?'}
            </label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder='Your feedback...'
              className='min-h-[80px] w-full resize-none rounded-md border p-2'
              maxLength={500}
            />
          </div>
        )}

        {/* Actions */}
        <div className='flex gap-2'>
          <Button onClick={handleSubmit} disabled={score === null} className='flex-1'>
            {t('submit')}
          </Button>
          {onClose && (
            <Button variant='outline' onClick={onClose}>
              {t('close')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
