// API Route: Generate PDF Reports
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api/middleware";
import { generatePDFReport } from "@/lib/reports/pdf";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await req.json();
      const { type, startDate, endDate } = body;

      if (!type || !startDate || !endDate) {
        return NextResponse.json(
          { error: "Missing required fields: type, startDate, endDate" },
          { status: 400 }
        );
      }

      const pdfBuffer = await generatePDFReport(
        context.tenantId,
        type,
        new Date(startDate),
        new Date(endDate)
      );

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="report-${type}-${startDate}-${endDate}.pdf"`,
        },
      });
    } catch (error) {
      console.error("Error generating PDF report:", error);
      return NextResponse.json(
        { error: "Failed to generate report" },
        { status: 500 }
      );
    }
  })(request);
}

