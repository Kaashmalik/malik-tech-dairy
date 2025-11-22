// IoT Webhook: POST /api/iot/milk-log
// Authenticates via API key, queues job via BullMQ, returns 202 Accepted immediately
import { NextRequest, NextResponse } from "next/server";
import { withApiKeyAuth, hasApiKeyPermission } from "@/lib/api/middleware-api-key";
import { milkLogQueue } from "@/lib/workers/queue";
import { createMilkLogSchema } from "@/lib/validations/milk";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withApiKeyAuth(async (req, context) => {
    try {
      // Check permission
      if (!hasApiKeyPermission(context.permissions, "milk_logs")) {
        return NextResponse.json(
          { error: "API key does not have permission to create milk logs" },
          { status: 403 }
        );
      }

      const body = await req.json();

      // Validate request body
      let validated;
      try {
        validated = createMilkLogSchema.parse(body);
      } catch (error: any) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }

      // Add job to BullMQ queue
      const job = await milkLogQueue.add(
        "create-milk-log",
        {
          tenantId: context.tenantId,
          ...validated,
          recordedBy: `api_key_${context.tenantId}`, // Mark as IoT-generated
          source: "iot",
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        }
      );

      // Return 202 Accepted immediately
      return NextResponse.json(
        {
          success: true,
          jobId: job.id,
          message: "Milk log queued for processing",
        },
        { status: 202 }
      );
    } catch (error) {
      console.error("Error processing IoT milk log:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  })(request);
}

