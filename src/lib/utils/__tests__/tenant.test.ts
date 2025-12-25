import { validateSubdomain, sanitizeSubdomain, generateSubdomain, getTenantUrl } from '../tenant';

describe('validateSubdomain', () => {
  it('should validate correct subdomains', () => {
    expect(validateSubdomain('test')).toBe(true);
    expect(validateSubdomain('test-farm')).toBe(true);
    expect(validateSubdomain('test123')).toBe(true);
    expect(validateSubdomain('a')).toBe(false); // Too short
    expect(validateSubdomain('a'.repeat(64))).toBe(false); // Too long
  });

  it('should reject invalid subdomains', () => {
    expect(validateSubdomain('')).toBe(false);
    expect(validateSubdomain('-test')).toBe(false); // Starts with hyphen
    expect(validateSubdomain('test-')).toBe(false); // Ends with hyphen
    expect(validateSubdomain('test_farm')).toBe(false); // Underscore not allowed
    expect(validateSubdomain('Test')).toBe(false); // Uppercase not allowed
    expect(validateSubdomain('test farm')).toBe(false); // Space not allowed
  });

  it('should handle edge cases', () => {
    expect(validateSubdomain('a'.repeat(63))).toBe(true); // Max length
    expect(validateSubdomain('a'.repeat(3))).toBe(true); // Min length
  });
});

describe('sanitizeSubdomain', () => {
  it('should convert to lowercase', () => {
    expect(sanitizeSubdomain('TEST')).toBe('test');
    expect(sanitizeSubdomain('TestFarm')).toBe('testfarm');
  });

  it('should replace invalid characters with hyphens', () => {
    expect(sanitizeSubdomain('test farm')).toBe('test-farm');
    expect(sanitizeSubdomain('test_farm')).toBe('test-farm');
    expect(sanitizeSubdomain('test@farm')).toBe('test-farm');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(sanitizeSubdomain('-test-')).toBe('test');
    expect(sanitizeSubdomain('--test--')).toBe('test');
  });

  it('should collapse multiple hyphens', () => {
    expect(sanitizeSubdomain('test---farm')).toBe('test-farm');
  });

  it('should trim whitespace', () => {
    expect(sanitizeSubdomain('  test  ')).toBe('test');
  });
});

describe('generateSubdomain', () => {
  it('should generate valid subdomain from farm name', () => {
    expect(generateSubdomain('Test Farm')).toBe('test-farm');
    expect(generateSubdomain('My Awesome Farm')).toBe('my-awesome-farm');
  });

  it('should handle short names', () => {
    expect(generateSubdomain('AB')).toBe('ab-farm');
    expect(generateSubdomain('A')).toBe('a-farm');
  });

  it('should truncate long names', () => {
    const longName = 'a'.repeat(100);
    const result = generateSubdomain(longName);
    expect(result.length).toBe(63);
  });

  it('should handle special characters', () => {
    // Apostrophe and special chars become hyphens, multiple hyphens are collapsed
    expect(generateSubdomain("Test's Farm & Co.")).toBe('test-s-farm-co');
  });
});

describe('getTenantUrl', () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
  });

  it('should generate tenant URL with default base URL', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getTenantUrl('test')).toBe('https://test.maliktechdairy.com');
  });

  it('should generate tenant URL with custom base URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
    expect(getTenantUrl('test')).toBe('https://test.example.com');
  });

  it('should handle base URL without protocol', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'example.com';
    expect(getTenantUrl('test')).toBe('https://test.example.com');
  });
});
