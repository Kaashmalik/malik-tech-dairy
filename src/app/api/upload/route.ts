// File Upload API Route
// POST: Upload file to Cloudinary

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// POST: Upload file
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'general';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, PDF' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size: 5MB' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Determine folder based on type
    const folderMap: Record<string, string> = {
      'payment-slip': 'mtk-dairy/payment-slips',
      animal: 'mtk-dairy/animals',
      document: 'mtk-dairy/documents',
      general: 'mtk-dairy/uploads',
    };
    const folder = folderMap[type] || folderMap.general;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: file.type === 'application/pdf' ? 'raw' : 'image',
      tags: [userId, type],
      context: {
        user_id: userId,
        original_name: file.name,
        upload_type: type,
      },
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      data: {
        id: uploadResult.public_id,
        url: uploadResult.secure_url,
        thumbnailUrl: uploadResult.secure_url.replace('/upload/', '/upload/w_200,h_200,c_fill/'),
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 });
  }
}
