// API Route: Generate PDF Reports
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { generatePDFReport } from "@/lib/reports/pdf";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    // Set logger context
    logger.setContext({
      tenantId: context.tenantId,
      userId: context.userId,
    });

    try {
      const body = await req.json();
      const { type, startDate, endDate } = body;

      if (!type || !startDate || !endDate) {
        logger.warn("Report generation failed: missing required fields", {
          type,
          startDate,
          endDate,
        });
        return NextResponse.json(
          { error: "Missing required fields: type, startDate, endDate" },
          { status: 400 }
        );
      }

      logger.info("Generating PDF report", { type, startDate, endDate });

      const pdfBuffer = await generatePDFReport(
        context.tenantId,
        type,
        new Date(startDate),
        new Date(endDate)
      );

      logger.info("PDF report generated successfully", {
        type,
        size: pdfBuffer.length,
      });

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="report-${type}-${startDate}-${endDate}.pdf"`,
        },
      });
    } catch (error) {
      logger.error("Error generating PDF report", error, {
        tenantId: context.tenantId,
      });
      return NextResponse.json(
        { error: "Failed to generate report" },
        { status: 500 }
      );
    }
  })(request);
}

