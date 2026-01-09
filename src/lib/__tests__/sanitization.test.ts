/**
 * Unit Tests for Input Sanitization Utilities
 */

import {
  sanitizeString,
  sanitizeHtml,
  sanitizeEmail,
  sanitizeUrl,
  sanitizePhone,
  sanitizeNumber,
  sanitizeInteger,
  sanitizeDate,
  sanitizeBoolean,
  sanitizeStringArray,
  sanitizeObject,
  sanitizeTag,
  sanitizeSearchQuery,
  sanitizeFileName,
  sanitizeDbIdentifier,
  sanitizeEnumValue,
} from '@/lib/utils/sanitization';

describe('Input Sanitization', () => {
  describe('sanitizeString', () => {
    it('should sanitize HTML tags', () => {
      const result = sanitizeString('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should trim whitespace', () => {
      const result = sanitizeString('  test  ');
      expect(result).toBe('test');
    });

    it('should handle empty strings', () => {
      const result = sanitizeString('');
      expect(result).toBe('');
    });

    it('should handle non-string input', () => {
      const result = sanitizeString(null as any);
      expect(result).toBe('');
    });
  });

  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const result = sanitizeHtml('<p>Hello <strong>world</strong></p>');
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should remove dangerous HTML', () => {
      const result = sanitizeHtml('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
    });

    it('should handle custom allowed tags', () => {
      const result = sanitizeHtml('<p>test</p><div>not allowed</div>', ['p']);
      expect(result).toContain('<p>');
      expect(result).not.toContain('<div>');
    });
  });

  describe('sanitizeEmail', () => {
    it('should validate and sanitize email', () => {
      const result = sanitizeEmail('test@example.com');
      expect(result).toBe('test@example.com');
    });

    it('should convert to lowercase', () => {
      const result = sanitizeEmail('TEST@EXAMPLE.COM');
      expect(result).toBe('test@example.com');
    });

    it('should throw error for invalid email', () => {
      expect(() => sanitizeEmail('invalid')).toThrow('Invalid email address');
    });

    it('should trim whitespace', () => {
      const result = sanitizeEmail('  test@example.com  ');
      expect(result).toBe('test@example.com');
    });
  });

  describe('sanitizeUrl', () => {
    it('should validate HTTP URL', () => {
      const result = sanitizeUrl('http://example.com');
      expect(result).toBe('http://example.com');
    });

    it('should validate HTTPS URL', () => {
      const result = sanitizeUrl('https://example.com');
      expect(result).toBe('https://example.com');
    });

    it('should throw error for invalid URL', () => {
      expect(() => sanitizeUrl('not-a-url')).toThrow('Invalid URL');
    });

    it('should throw error for non-HTTP protocol', () => {
      expect(() => sanitizeUrl('ftp://example.com')).toThrow('Invalid URL');
    });
  });

  describe('sanitizePhone', () => {
    it('should sanitize phone number', () => {
      const result = sanitizePhone('+1 (555) 123-4567');
      expect(result).toBe('15551234567');
    });

    it('should throw error for too short number', () => {
      expect(() => sanitizePhone('123')).toThrow('Invalid phone number');
    });

    it('should throw error for too long number', () => {
      expect(() => sanitizePhone('1'.repeat(20))).toThrow('Invalid phone number');
    });
  });

  describe('sanitizeNumber', () => {
    it('should parse number from string', () => {
      const result = sanitizeNumber('123.45');
      expect(result).toBe(123.45);
    });

    it('should return number as is', () => {
      const result = sanitizeNumber(123.45);
      expect(result).toBe(123.45);
    });

    it('should throw error for invalid number', () => {
      expect(() => sanitizeNumber('not-a-number')).toThrow('Invalid number');
    });

    it('should throw error for infinity', () => {
      expect(() => sanitizeNumber(Infinity)).toThrow('Invalid number');
    });
  });

  describe('sanitizeInteger', () => {
    it('should parse integer from string', () => {
      const result = sanitizeInteger('123');
      expect(result).toBe(123);
    });

    it('should throw error for decimal', () => {
      expect(() => sanitizeInteger('123.45')).toThrow('Invalid integer');
    });
  });

  describe('sanitizeDate', () => {
    it('should validate ISO date', () => {
      const result = sanitizeDate('2024-01-01T00:00:00Z');
      expect(result).toBe('2024-01-01T00:00:00Z');
    });

    it('should throw error for invalid date', () => {
      expect(() => sanitizeDate('not-a-date')).toThrow('Invalid date format');
    });
  });

  describe('sanitizeBoolean', () => {
    it('should parse true values', () => {
      expect(sanitizeBoolean('true')).toBe(true);
      expect(sanitizeBoolean('1')).toBe(true);
      expect(sanitizeBoolean('yes')).toBe(true);
      expect(sanitizeBoolean(true)).toBe(true);
    });

    it('should parse false values', () => {
      expect(sanitizeBoolean('false')).toBe(false);
      expect(sanitizeBoolean('0')).toBe(false);
      expect(sanitizeBoolean('no')).toBe(false);
      expect(sanitizeBoolean(false)).toBe(false);
    });

    it('should throw error for invalid boolean', () => {
      expect(() => sanitizeBoolean('maybe')).toThrow('Invalid boolean value');
    });
  });

  describe('sanitizeTag', () => {
    it('should sanitize tag', () => {
      const result = sanitizeTag('abc-123');
      expect(result).toBe('ABC-123');
    });

    it('should convert to uppercase', () => {
      const result = sanitizeTag('tag123');
      expect(result).toBe('TAG123');
    });

    it('should throw error for invalid characters', () => {
      expect(() => sanitizeTag('tag@123')).toThrow('Tag can only contain');
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should sanitize search query', () => {
      const result = sanitizeSearchQuery('test query');
      expect(result).toBe('test query');
    });

    it('should remove SQL special characters', () => {
      const result = sanitizeSearchQuery("test'; DROP TABLE--");
      expect(result).not.toContain("'");
      expect(result).not.toContain(';');
      expect(result).not.toContain('--');
    });

    it('should limit length', () => {
      const longQuery = 'a'.repeat(150);
      const result = sanitizeSearchQuery(longQuery);
      expect(result.length).toBe(100);
    });
  });

  describe('sanitizeFileName', () => {
    it('should sanitize file name', () => {
      const result = sanitizeFileName('test file.txt');
      expect(result).toBe('test_file.txt');
    });

    it('should remove path traversal', () => {
      const result = sanitizeFileName('../../../etc/passwd');
      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
    });

    it('should limit length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe('sanitizeDbIdentifier', () => {
    it('should validate identifier', () => {
      const result = sanitizeDbIdentifier('table_name');
      expect(result).toBe('table_name');
    });

    it('should throw error for invalid characters', () => {
      expect(() => sanitizeDbIdentifier('table-name')).toThrow('Invalid database identifier');
    });

    it('should throw error for starting with number', () => {
      expect(() => sanitizeDbIdentifier('1table')).toThrow('Invalid database identifier');
    });
  });

  describe('sanitizeEnumValue', () => {
    it('should validate enum value', () => {
      const result = sanitizeEnumValue('cattle', ['cattle', 'buffalo', 'goat']);
      expect(result).toBe('cattle');
    });

    it('should throw error for invalid value', () => {
      expect(() => sanitizeEnumValue('invalid', ['cattle', 'buffalo'])).toThrow(
        'Invalid enum value'
      );
    });
  });
});
