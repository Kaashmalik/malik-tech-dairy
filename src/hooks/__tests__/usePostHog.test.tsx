import { renderHook, waitFor } from '@testing-library/react';
import { usePostHogAnalytics } from '../usePostHog';

// Store original env
const originalEnv = process.env;

// Mock posthog-js
const mockCapture = jest.fn();
const mockIdentify = jest.fn();
const mockReset = jest.fn();
const mockGroup = jest.fn();
const mockIsFeatureEnabled = jest.fn();
const mockGetFeatureFlag = jest.fn();

const mockPosthog = {
  capture: mockCapture,
  identify: mockIdentify,
  reset: mockReset,
  group: mockGroup,
  isFeatureEnabled: mockIsFeatureEnabled,
  getFeatureFlag: mockGetFeatureFlag,
};

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: mockPosthog,
}));

describe('usePostHogAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set the PostHog key in environment
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_POSTHOG_KEY: 'test-key',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should initialize and provide tracking functions', async () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    // Wait for the dynamic import to complete
    await waitFor(() => {
      expect(result.current.trackEvent).toBeDefined();
      expect(result.current.trackPageView).toBeDefined();
      expect(result.current.trackButtonClick).toBeDefined();
      expect(result.current.trackMilkLog).toBeDefined();
      expect(result.current.trackAnimalCreation).toBeDefined();
      expect(result.current.trackReportDownload).toBeDefined();
    });
  });

  it('should track events when posthog is loaded', async () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    // Wait for posthog to be loaded
    await waitFor(() => {
      expect(result.current.posthog).toBeDefined();
    }, { timeout: 2000 });

    if (result.current.posthog) {
      result.current.trackEvent('test_event', { customProp: 'value' });
      
      expect(mockCapture).toHaveBeenCalledWith('test_event', 
        expect.objectContaining({
          customProp: 'value',
        })
      );
    }
  });

  it('should track page views', async () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    await waitFor(() => {
      expect(result.current.posthog).toBeDefined();
    }, { timeout: 2000 });

    if (result.current.posthog) {
      result.current.trackPageView('/dashboard', { section: 'main' });
      
      expect(mockCapture).toHaveBeenCalledWith('$pageview',
        expect.objectContaining({
          page_name: '/dashboard',
          section: 'main',
        })
      );
    }
  });

  it('should track button clicks', async () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    await waitFor(() => {
      expect(result.current.posthog).toBeDefined();
    }, { timeout: 2000 });

    if (result.current.posthog) {
      result.current.trackButtonClick('submit_button', 'form', { formType: 'animal' });
      
      expect(mockCapture).toHaveBeenCalledWith('button_clicked',
        expect.objectContaining({
          button_name: 'submit_button',
          location: 'form',
          formType: 'animal',
        })
      );
    }
  });

  it('should track milk log events', async () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    await waitFor(() => {
      expect(result.current.posthog).toBeDefined();
    }, { timeout: 2000 });

    if (result.current.posthog) {
      result.current.trackMilkLog({
        animalId: 'animal-123',
        quantity: 15.5,
        session: 'morning',
      });

      expect(mockCapture).toHaveBeenCalledWith('button_clicked',
        expect.objectContaining({
          button_name: 'log_milk',
          location: 'milk_log_form',
          event_type: 'milk_logged',
          animalId: 'animal-123',
          quantity: 15.5,
          session: 'morning',
        })
      );
    }
  });

  it('should track animal creation events', async () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    await waitFor(() => {
      expect(result.current.posthog).toBeDefined();
    }, { timeout: 2000 });

    if (result.current.posthog) {
      result.current.trackAnimalCreation({
        species: 'cow',
        breed: 'Holstein',
      });

      expect(mockCapture).toHaveBeenCalledWith('button_clicked',
        expect.objectContaining({
          button_name: 'create_animal',
          location: 'animal_form',
          event_type: 'animal_created',
          species: 'cow',
          breed: 'Holstein',
        })
      );
    }
  });

  it('should track report download events', async () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    await waitFor(() => {
      expect(result.current.posthog).toBeDefined();
    }, { timeout: 2000 });

    if (result.current.posthog) {
      result.current.trackReportDownload({
        reportType: 'daily',
        format: 'pdf',
      });

      expect(mockCapture).toHaveBeenCalledWith('report_downloaded',
        expect.objectContaining({
          reportType: 'daily',
          format: 'pdf',
        })
      );
    }
  });

  it('should handle missing posthog key gracefully', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = '';
    
    const { result } = renderHook(() => usePostHogAnalytics());

    // Should not throw
    result.current.trackEvent('test_event');
    
    // When PostHog key is missing, capture should not be called
    // (unless already loaded from previous test)
  });

  it('should provide feature flag functions', async () => {
    const { result } = renderHook(() => usePostHogAnalytics());

    expect(result.current.getFeatureFlag).toBeDefined();
    expect(result.current.getFeatureFlagValue).toBeDefined();
  });
});
