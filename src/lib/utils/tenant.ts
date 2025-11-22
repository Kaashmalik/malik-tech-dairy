// Tenant Utility Functions

/**
 * Validate subdomain format
 */
export function validateSubdomain(subdomain: string): boolean {
  // Subdomain must be:
  // - 3-63 characters
  // - Only lowercase letters, numbers, and hyphens
  // - Cannot start or end with hyphen
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
  return subdomainRegex.test(subdomain) && subdomain.length >= 3 && subdomain.length <= 63;
}

/**
 * Sanitize subdomain (convert to valid format)
 */
export function sanitizeSubdomain(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-") // Replace invalid chars with hyphen
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate tenant subdomain from farm name
 */
export function generateSubdomain(farmName: string): string {
  const sanitized = sanitizeSubdomain(farmName);
  
  // Ensure minimum length
  if (sanitized.length < 3) {
    return sanitized + "-farm";
  }
  
  // Ensure maximum length
  if (sanitized.length > 63) {
    return sanitized.substring(0, 63);
  }
  
  return sanitized;
}

/**
 * Get tenant URL from subdomain
 */
export function getTenantUrl(subdomain: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://maliktechdairy.com";
  return `https://${subdomain}.${baseUrl.replace("https://", "")}`;
}

