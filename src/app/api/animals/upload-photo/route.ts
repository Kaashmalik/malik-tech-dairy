// API Route: Upload Animal Photo to Firebase Storage
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { adminStorage } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminStorage) {
        return NextResponse.json({ error: 'Storage not available' }, { status: 500 });
      }

      const formData = await req.formData();
      const file = formData.get('file') as File;
      const animalId = formData.get('animalId') as string;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
      }

      // Create tenant-scoped path
      const fileName = `${animalId || Date.now()}_${file.name}`;
      const filePath = `tenants/${context.tenantId}/animals/${fileName}`;

      // Convert File to Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Firebase Storage
      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(filePath);

      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
          metadata: {
            tenantId: context.tenantId,
            uploadedBy: context.userId,
          },
        },
      });

      // Make file publicly accessible (or use signed URL for private)
      await fileRef.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        path: filePath,
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
