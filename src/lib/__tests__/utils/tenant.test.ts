import { validateSubdomain, sanitizeSubdomain, generateSubdomain, getTenantUrl } from "@/lib/utils/tenant";

describe("Tenant Utilities", () => {
  describe("validateSubdomain", () => {
    it("should validate valid subdomains", () => {
      expect(validateSubdomain("myfarm")).toBe(true);
      expect(validateSubdomain("my-farm")).toBe(true);
      expect(validateSubdomain("myfarm123")).toBe(true);
      expect(validateSubdomain("abc")).toBe(true);
      expect(validateSubdomain("a".repeat(63))).toBe(true);
    });

    it("should reject invalid subdomains", () => {
      expect(validateSubdomain("")).toBe(false);
      expect(validateSubdomain("ab")).toBe(false); // Too short
      expect(validateSubdomain("a".repeat(64))).toBe(false); // Too long
      expect(validateSubdomain("-myfarm")).toBe(false); // Starts with hyphen
      expect(validateSubdomain("myfarm-")).toBe(false); // Ends with hyphen
      expect(validateSubdomain("my_farm")).toBe(false); // Underscore not allowed
      expect(validateSubdomain("MyFarm")).toBe(false); // Uppercase not allowed
      expect(validateSubdomain("my farm")).toBe(false); // Space not allowed
    });
  });

  describe("sanitizeSubdomain", () => {
    it("should sanitize valid inputs", () => {
      expect(sanitizeSubdomain("My Farm")).toBe("my-farm");
      expect(sanitizeSubdomain("MyFarm123")).toBe("myfarm123");
      expect(sanitizeSubdomain("  My Farm  ")).toBe("my-farm");
      expect(sanitizeSubdomain("my---farm")).toBe("my-farm");
      expect(sanitizeSubdomain("my@farm#test")).toBe("my-farm-test");
    });

    it("should handle edge cases", () => {
      expect(sanitizeSubdomain("")).toBe("");
      expect(sanitizeSubdomain("---")).toBe("");
      expect(sanitizeSubdomain("   ")).toBe("");
    });
  });

  describe("generateSubdomain", () => {
    it("should generate valid subdomains", () => {
      expect(generateSubdomain("My Farm")).toBe("my-farm");
      expect(generateSubdomain("ABC")).toBe("abc");
      expect(generateSubdomain("Test Farm 123")).toBe("test-farm-123");
    });

    it("should ensure minimum length", () => {
      expect(generateSubdomain("AB")).toBe("ab-farm");
      expect(generateSubdomain("A")).toBe("a-farm");
    });

    it("should truncate to maximum length", () => {
      const longName = "a".repeat(100);
      const result = generateSubdomain(longName);
      expect(result.length).toBe(63);
    });
  });

  describe("getTenantUrl", () => {
    it("should generate correct tenant URL", () => {
      const url = getTenantUrl("myfarm");
      expect(url).toContain("myfarm");
      expect(url).toMatch(/^https:\/\//);
    });

    it("should use default URL if env var not set", () => {
      const originalUrl = process.env.NEXT_PUBLIC_APP_URL;
      delete (process.env as any).NEXT_PUBLIC_APP_URL;
      
      const url = getTenantUrl("myfarm");
      expect(url).toBe("https://myfarm.maliktechdairy.com");
      
      if (originalUrl) {
        process.env.NEXT_PUBLIC_APP_URL = originalUrl;
      }
    });
  });
});

