import { Logger, logger } from '../logger';
import * as Sentry from '@sentry/nextjs';

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn(callback => {
    const scope = {
      setTag: jest.fn(),
      setContext: jest.fn(),
      setUser: jest.fn(),
      setLevel: jest.fn(),
    };
    callback(scope);
  }),
}));

describe('Logger', () => {
  let consoleSpy: {
    debug: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: jest.spyOn(console, 'debug').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe('debug', () => {
    it('should log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logger.debug('Test debug message');

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Test debug message')
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log debug messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      logger.debug('Test debug message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test info message');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test info message')
      );
    });

    it('should include context in log message', () => {
      logger.setContext({ tenantId: 'test-tenant' });
      logger.info('Test message');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"tenantId":"test-tenant"')
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning');

      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warning',
          message: 'Test warning',
        })
      );
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);

      expect(consoleSpy.error).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should capture error with tenant context', () => {
      logger.setContext({ tenantId: 'test-tenant', userId: 'test-user' });
      const error = new Error('Test error');
      logger.error('Test error', error);

      expect(Sentry.withScope).toHaveBeenCalled();
    });

    it('should handle non-Error objects', () => {
      logger.error('Test error message', { code: 'ERR_TEST' });

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test error message', 'error');
    });
  });

  describe('fatal', () => {
    it('should log fatal errors', () => {
      const error = new Error('Fatal error');
      logger.fatal('Fatal error message', error);

      expect(consoleSpy.error).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should set fatal level in Sentry', () => {
      logger.fatal('Fatal error');

      expect(Sentry.withScope).toHaveBeenCalled();
    });
  });

  describe('child logger', () => {
    it('should create child logger with additional context', () => {
      logger.setContext({ tenantId: 'parent-tenant' });
      const childLogger = logger.child({ userId: 'child-user' });

      childLogger.info('Test message');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"tenantId":"parent-tenant"')
      );
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"userId":"child-user"')
      );
    });
  });

  describe('context management', () => {
    it('should set and clear context', () => {
      logger.setContext({ tenantId: 'test-tenant' });
      logger.info('Message 1');

      logger.clearContext();
      logger.info('Message 2');

      expect(consoleSpy.info).toHaveBeenCalledTimes(2);
    });
  });
});
