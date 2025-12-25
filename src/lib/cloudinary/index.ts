// Cloudinary Integration - Primary File Storage
// Supabase Storage is used as backup for critical files
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
export type CloudinaryFolder =
  | 'payment-slips'
  | 'animals'
  | 'logos'
  | 'receipts'
  | 'documents'
  | 'avatars';
export interface UploadOptions {
  folder: CloudinaryFolder;
  publicId?: string;
  resourceType?: 'image' | 'raw' | 'auto';
  transformation?: object[];
  tags?: string[];
  context?: Record<string, string>;
}
export interface UploadResult {
  success: boolean;
  publicId?: string;
  url?: string;
  secureUrl?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  error?: string;
}
/**
 * Upload a file to Cloudinary
 * @param file - Base64 string or file URL
 * @param options - Upload options including folder and transformations
 */
export async function uploadToCloudinary(
  file: string,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    const uploadOptions: Record<string, unknown> = {
      folder: `malik-tech-dairy/${options.folder}`,
      resource_type: options.resourceType || 'auto',
      tags: options.tags || [],
      context: options.context || {},
    };
    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }
    // Add transformations for images
    if (options.resourceType === 'image' || !options.resourceType) {
      uploadOptions.transformation = options.transformation || [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ];
    }
    const result: UploadApiResponse = await cloudinary.uploader.upload(file, uploadOptions);
    // Generate thumbnail URL for images
    let thumbnailUrl: string | undefined;
    if (result.resource_type === 'image') {
      thumbnailUrl = cloudinary.url(result.public_id, {
        transformation: [
          { width: 150, height: 150, crop: 'thumb', gravity: 'auto' },
          { quality: 'auto:low' },
          { fetch_format: 'auto' },
        ],
      });
    }
    return {
      success: true,
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      thumbnailUrl,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    const cloudinaryError = error as UploadApiErrorResponse;
    return {
      success: false,
      error: cloudinaryError.message || 'Failed to upload file',
    };
  }
}
/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param resourceType - The resource type (image, raw, video)
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'raw' | 'video' = 'image'
): Promise<{ success: boolean; error?: string }> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete file' };
  }
}
/**
 * Generate a signed upload URL for direct browser uploads
 * @param folder - The folder to upload to
 * @param maxFileSize - Maximum file size in bytes (default 10MB)
 */
export function generateSignedUploadParams(
  folder: CloudinaryFolder,
  maxFileSize: number = 10 * 1024 * 1024
): {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
} {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folderPath = `malik-tech-dairy/${folder}`;
  const paramsToSign = {
    timestamp,
    folder: folderPath,
    upload_preset: 'malik-tech-dairy',
  };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );
  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder: folderPath,
  };
}
/**
 * Get optimized URL for an image with transformations
 * @param publicId - The public ID of the image
 * @param options - Transformation options
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}
): string {
  const transformations: object[] = [];
  if (options.width || options.height) {
    transformations.push({
      width: options.width,
      height: options.height,
      crop: options.crop || 'fill',
      gravity: 'auto',
    });
  }
  transformations.push({
    quality: options.quality || 'auto:good',
    fetch_format: options.format || 'auto',
  });
  return cloudinary.url(publicId, { transformation: transformations });
}
/**
 * Validate file type before upload
 */
export function validateFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  paymentSlip: 5 * 1024 * 1024, // 5MB
};
export { cloudinary };