import { renderHook, act } from '@testing-library/react';
import { useTenantStore } from '@/store/tenantStore';
import type { TenantConfig } from '@/types';

describe('TenantStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useTenantStore());
    act(() => {
      result.current.reset();
    });
  });

  it('should initialize with null config', () => {
    const { result } = renderHook(() => useTenantStore());
    expect(result.current.config).toBe(null);
  });

  it('should set config', () => {
    const { result } = renderHook(() => useTenantStore());
    const mockConfig: TenantConfig = {
      farmName: 'Test Farm',
      farmAddress: '123 Test St',
      primaryColor: '#1F7A3D',
      secondaryColor: '#2E8B57',
      logoUrl: 'https://example.com/logo.png',
      language: 'en',
      animalTypes: ['cow', 'buffalo'],
    };

    act(() => {
      result.current.setConfig(mockConfig);
    });

    expect(result.current.config).toEqual(mockConfig);
  });

  it('should update config', () => {
    const { result } = renderHook(() => useTenantStore());
    const initialConfig: TenantConfig = {
      farmName: 'Initial Farm',
      farmAddress: '123 Test St',
      primaryColor: '#1F7A3D',
      secondaryColor: '#2E8B57',
      logoUrl: 'https://example.com/logo.png',
      language: 'en',
      animalTypes: ['cow'],
    };

    const updatedConfig: TenantConfig = {
      ...initialConfig,
      farmName: 'Updated Farm',
      animalTypes: ['cow', 'buffalo'],
    };

    act(() => {
      result.current.setConfig(initialConfig);
    });

    act(() => {
      result.current.setConfig(updatedConfig);
    });

    expect(result.current.config).toEqual(updatedConfig);
  });

  it('should reset config', () => {
    const { result } = renderHook(() => useTenantStore());
    const mockConfig: TenantConfig = {
      farmName: 'Test Farm',
      farmAddress: '123 Test St',
      primaryColor: '#1F7A3D',
      secondaryColor: '#2E8B57',
      logoUrl: 'https://example.com/logo.png',
      language: 'en',
      animalTypes: ['cow'],
    };

    act(() => {
      result.current.setConfig(mockConfig);
    });

    expect(result.current.config).not.toBe(null);

    act(() => {
      result.current.reset();
    });

    expect(result.current.config).toBe(null);
  });

  it('should handle null config', () => {
    const { result } = renderHook(() => useTenantStore());
    const mockConfig: TenantConfig = {
      farmName: 'Test Farm',
      farmAddress: '123 Test St',
      primaryColor: '#1F7A3D',
      secondaryColor: '#2E8B57',
      logoUrl: 'https://example.com/logo.png',
      language: 'en',
      animalTypes: ['cow'],
    };

    act(() => {
      result.current.setConfig(mockConfig);
    });

    act(() => {
      result.current.setConfig(null);
    });

    expect(result.current.config).toBe(null);
  });
});
