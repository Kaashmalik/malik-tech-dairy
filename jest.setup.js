// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// ============================================================================
// MSW Server Setup (optional - gracefully handle if not available)
// ============================================================================
let server;

try {
  // Dynamic import to handle ESM modules in MSW v2
  const mswSetup = require('./src/mocks/server');
  server = mswSetup.server;
} catch (e) {
  console.warn('MSW server not available, using global fetch mocks instead');
  server = null;
}

// Establish API mocking before all tests (if MSW is available)
beforeAll(() => {
  if (server) {
    server.listen({ onUnhandledRequest: 'bypass' });
  }
});

// Reset any request handlers that we may add during the tests
afterEach(() => {
  if (server) {
    server.resetHandlers();
  }
  jest.clearAllMocks();
});

// Clean up after the tests are finished
afterAll(() => {
  if (server) {
    server.close();
  }
});

// ============================================================================
// Global Fetch Mock (fallback when MSW is not available)
// ============================================================================
if (!server) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  );
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      refresh: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(() => ({
    userId: 'test-user-id',
    isLoaded: true,
  })),
  useOrganization: jest.fn(() => ({
    organization: {
      id: 'test-org-id',
      slug: 'test-org',
      name: 'Test Organization',
    },
    isLoaded: true,
  })),
  useUser: jest.fn(() => ({
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
    isLoaded: true,
  })),
  useClerk: jest.fn(() => ({
    signOut: jest.fn(),
  })),
  auth: jest.fn(() => ({
    userId: 'test-user-id',
    orgId: 'test-org-id',
  })),
  OrganizationSwitcher: () => null,
  UserButton: () => null,
}));

// Mock PostHog
jest.mock('posthog-js/react', () => ({
  usePostHog: jest.fn(() => ({
    capture: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    group: jest.fn(),
  })),
}));

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

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  
  const createMotionComponent = (tag) => {
    const component = React.forwardRef(({ 
      children, 
      initial, 
      animate, 
      exit, 
      variants, 
      whileHover, 
      whileTap,
      transition,
      ...props 
    }, ref) => React.createElement(tag, { ...props, ref }, children));
    component.displayName = `motion.${tag}`;
    return component;
  };
  
  return {
    motion: {
      div: createMotionComponent('div'),
      button: createMotionComponent('button'),
      span: createMotionComponent('span'),
      a: createMotionComponent('a'),
      details: createMotionComponent('details'),
      section: createMotionComponent('section'),
      article: createMotionComponent('article'),
      header: createMotionComponent('header'),
      footer: createMotionComponent('footer'),
      main: createMotionComponent('main'),
      nav: createMotionComponent('nav'),
      aside: createMotionComponent('aside'),
      ul: createMotionComponent('ul'),
      li: createMotionComponent('li'),
      p: createMotionComponent('p'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
    },
    AnimatePresence: ({ children }) => children,
  };
});

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
  Toaster: () => null,
}));

// Mock the Tabs component from shadcn/ui
jest.mock('@/components/ui/tabs', () => {
  const React = require('react');
  return {
    Tabs: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'tabs', ...props }, children),
    TabsList: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'tabs-list', role: 'tablist', ...props }, children),
    TabsTrigger: ({ children, value, ...props }) => React.createElement('button', { 'data-testid': `tab-${value}`, role: 'tab', ...props }, children),
    TabsContent: ({ children, value, ...props }) => React.createElement('div', { 'data-testid': `tabcontent-${value}`, role: 'tabpanel', ...props }, children),
  };
});

// Mock Dialog component
jest.mock('@/components/ui/dialog', () => {
  const React = require('react');
  return {
    Dialog: ({ children, open }) => open ? React.createElement('div', { 'data-testid': 'dialog' }, children) : null,
    DialogContent: ({ children, ...props }) => React.createElement('div', { 'data-testid': 'dialog-content', ...props }, children),
    DialogDescription: ({ children, ...props }) => React.createElement('p', { ...props }, children),
    DialogFooter: ({ children, ...props }) => React.createElement('div', { ...props }, children),
    DialogHeader: ({ children, ...props }) => React.createElement('div', { ...props }, children),
    DialogTitle: ({ children, ...props }) => React.createElement('h2', { ...props }, children),
    DialogTrigger: ({ children, ...props }) => React.createElement('button', { ...props }, children),
  };
});

// Suppress console errors in tests unless explicitly testing them
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || 
       args[0].includes('Error:') ||
       args[0].includes('ReactDOM.render'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('MSW')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
