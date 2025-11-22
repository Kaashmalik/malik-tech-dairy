// API Key Management Routes
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { TenantRole, PlatformRole } from "@/types/roles";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from "@/lib/api-keys";
import { createApiKeySchema, listApiKeysSchema } from "@/lib/validations/api-keys";
import { withMFAEnforcement } from "@/lib/middleware/mfaMiddleware";

export const dynamic = "force-dynamic";

// GET: List API keys
export async function GET(request: NextRequest) {
  return withMFAEnforcement(async (req, { tenantId, userId }) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = listApiKeysSchema.parse({
        isActive: searchParams.get("isActive"),
      });

      const keys = await listApiKeys(tenantId, {
        includeInactive: query.isActive === false,
      });

      // Remove sensitive data (keyHash) from response
      const safeKeys = keys.map(({ keyHash, ...rest }) => ({
        ...rest,
        key: undefined, // Never return the actual key
      }));

      return NextResponse.json({ keys: safeKeys });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return NextResponse.json(
          { error: "Invalid request parameters", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error listing API keys:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

// POST: Create new API key
export async function POST(request: NextRequest) {
  return withMFAEnforcement(async (req, { tenantId, userId }) => {
    try {
      const body = await req.json();
      const validated = createApiKeySchema.parse(body);

      const { apiKey, plainKey } = await createApiKey(tenantId, userId, {
        name: validated.name,
        description: validated.description,
        permissions: validated.permissions,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
      });

      // Return API key only once (client must save it)
      return NextResponse.json({
        success: true,
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          description: apiKey.description,
          keyPrefix: apiKey.keyPrefix,
          permissions: apiKey.permissions,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt,
        },
        key: plainKey, // Only returned once!
        warning: "Save this key securely. It will not be shown again.",
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return NextResponse.json(
          { error: "Invalid request data", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Error creating API key:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

