# API Versioning Strategy

## Overview

This document describes the API versioning strategy for MTK Dairy.

## Version Structure

```
/api/v1/animals
/api/v1/milk
/api/v1/health
/api/v2/animals  // New version with breaking changes
```

## Versioning Rules

### When to increment version:

- **Major (v1 → v2)**: Breaking changes to existing endpoints
  - Remove or rename fields
  - Change data types
  - Change authentication requirements
  - Remove endpoints

- **Minor (v1.0 → v1.1)**: New features, backward compatible
  - Add new endpoints
  - Add new optional fields
  - Add new query parameters

- **Patch (v1.0.0 → v1.0.1)**: Bug fixes, backward compatible
  - Fix bugs without changing API
  - Improve performance
  - Update documentation

## Supported Versions

- **v1**: Current stable version
- **v2**: Latest version (when available)

## Deprecation Policy

- Versions are supported for at least 6 months after deprecation
- Deprecated versions return `X-API-Deprecated: true` header
- Deprecated versions include `X-API-Sunset-Date` header

## Version Headers

### Request Headers:

```
X-API-Version: 1.0
Accept: application/vnd.mtkdairy.v1+json
```

### Response Headers:

```
X-API-Version: 1.0
X-API-Deprecated: true
X-API-Sunset-Date: 2026-07-01
```

## Migration Guide

### Upgrading from v1 to v2:

**Breaking Changes:**

1. `animals` endpoint now requires `tenant_id` in query params
2. `milk_logs` renamed to `milk_logs` (was `milk`)
3. Response format changed: `data.animals` → `data.items`

**Migration Steps:**

1. Update API base URL from `/api/` to `/api/v2/`
2. Add tenant_id to all requests
3. Update response parsing logic
4. Test all integrations

## Version-Specific Features

### v1 Features:

- Basic CRUD operations
- Tenant isolation
- Rate limiting
- Authentication

### v2 Features (Planned):

- Enhanced filtering and sorting
- Batch operations
- Real-time updates
- Advanced analytics
- Webhook support

## Implementation

### Version Middleware:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function withApiVersion(
  handler: (request: NextRequest, version: string) => Promise<NextResponse>,
  minVersion: string = '1.0'
) {
  return async (request: NextRequest) => {
    const version = request.headers.get('X-API-Version') || '1.0';

    // Validate version
    if (compareVersions(version, minVersion) < 0) {
      return NextResponse.json(
        {
          error: 'API version not supported',
          minVersion,
          currentVersion: version,
        },
        {
          status: 400,
          headers: {
            'X-API-Version': version,
            'X-API-Supported-Versions': '1.0,2.0',
          },
        }
      );
    }

    // Call handler with version
    const response = await handler(request, version);

    // Add version headers
    response.headers.set('X-API-Version', version);
    response.headers.set('X-API-Supported-Versions', '1.0,2.0');

    return response;
  };
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}
```

### Version-Specific Route:

```typescript
// src/app/api/v1/animals/route.ts
export async function GET(request: NextRequest) {
  // v1 implementation
  return NextResponse.json({
    version: '1.0',
    data: { animals: [...] },
  });
}

// src/app/api/v2/animals/route.ts
export async function GET(request: NextRequest) {
  // v2 implementation with enhanced features
  return NextResponse.json({
    version: '2.0',
    data: { items: [...], metadata: {...} },
  });
}
```

## Testing

### Version Compatibility Tests:

```typescript
describe('API Versioning', () => {
  it('should use v1 by default', async () => {
    const response = await fetch('/api/animals');
    expect(response.headers.get('X-API-Version')).toBe('1.0');
  });

  it('should support explicit version header', async () => {
    const response = await fetch('/api/animals', {
      headers: { 'X-API-Version': '2.0' },
    });
    expect(response.headers.get('X-API-Version')).toBe('2.0');
  });

  it('should reject unsupported versions', async () => {
    const response = await fetch('/api/animals', {
      headers: { 'X-API-Version': '0.5' },
    });
    expect(response.status).toBe(400);
  });
});
```

## Documentation

### API Documentation:

- Each version has its own OpenAPI spec
- Available at `/api/docs/v1`, `/api/docs/v2`
- Includes version-specific examples

### Changelog:

Maintained in `CHANGELOG.md`:

```markdown
## [2.0.0] - 2026-02-01

### Added

- Batch operations support
- Real-time updates via WebSockets
- Advanced filtering and sorting

### Changed

- Renamed `milk` endpoint to `milk_logs`
- Response format: `data.animals` → `data.items`
- Added required `tenant_id` query parameter

### Deprecated

- Old response format (will be removed in v3.0)

### Removed

- Legacy authentication method
```

## Rollback Plan

If a new version has critical issues:

1. Update load balancer to route to previous version
2. Monitor error rates
3. Fix issues in new version
4. Gradually roll out again

## Communication

### Version Announcements:

- Email notifications 30 days before deprecation
- In-app banners for deprecated versions
- API status page updates
- Developer newsletter

### Support:

- Legacy versions supported for 6 months post-deprecation
- Migration guides provided
- Support team available for questions
