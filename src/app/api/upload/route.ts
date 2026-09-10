import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { writeFile, mkdir, unlink } from 'fs/promises';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const isRealServiceKey =
    rawServiceKey &&
    !rawServiceKey.includes('your-') &&
    !rawServiceKey.includes('placeholder') &&
    rawServiceKey.length > 30;

  const key = isRealServiceKey
    ? rawServiceKey
    : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
       process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
       '');

  return {
    client: createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    }),
    hasServiceRole: Boolean(isRealServiceKey)
  };
}

/**
 * GET /api/upload?bucket=product-images
 * Check whether a Supabase storage bucket exists.
 */
export async function GET(req: NextRequest) {
  try {
    const bucket = req.nextUrl.searchParams.get('bucket') || 'product-images';
    const { client, hasServiceRole } = getAdminClient();

    let exists = false;
    let errorMsg: string | null = null;

    try {
      const { data: bucketData, error: bErr } = await client.storage.getBucket(bucket);
      if (bucketData) {
        exists = true;
      } else if (bErr) {
        errorMsg = bErr.message;
      }
    } catch (err: any) {
      errorMsg = err?.message || 'Failed to inspect bucket';
    }

    return NextResponse.json({
      success: true,
      bucket,
      exists,
      hasServiceRole,
      error: errorMsg
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Bucket check failed'
    }, { status: 500 });
  }
}

/**
 * POST /api/upload
 * Body: multipart/form-data
 *   - file: File (required)
 *   - bucket: string (default: 'product-images')
 *   - folder: string (default: 'uploads')
 *
 * Tries Supabase Storage bucket first.
 * If bucket is not yet created or denied, saves to /public/uploads/ on local server as a reliable fallback.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'product-images';
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif'
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `File type ${file.type} not allowed. Use: JPEG, PNG, WebP, GIF, AVIF` },
        { status: 400 }
      );
    }

    // Validate file size (15 MB max)
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large. Max size is 15 MB.' },
        { status: 400 }
      );
    }

    const { client, hasServiceRole } = getAdminClient();

    // Build safe filename: timestamp + sanitized original name
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeName = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    const fileName = `${folder}/${Date.now()}_${safeName}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 1. If service role is present, try to auto-create bucket if missing
    if (hasServiceRole) {
      try {
        const { data: bucketData } = await client.storage.getBucket(bucket);
        if (!bucketData) {
          await client.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: 15 * 1024 * 1024,
            allowedMimeTypes: allowedTypes
          });
        }
      } catch (e) {
        console.warn('[upload] Auto-create bucket skipped:', e);
      }
    }

    // 2. Attempt upload to Supabase Storage bucket
    try {
      const { data: uploadData, error: uploadError } = await client.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true
        });

      if (!uploadError && uploadData?.path) {
        const { data: urlData } = client.storage.from(bucket).getPublicUrl(uploadData.path);
        return NextResponse.json({
          success: true,
          publicUrl: urlData.publicUrl,
          path: uploadData.path,
          bucket,
          source: 'supabase'
        });
      }

      console.warn('[upload] Supabase bucket upload notice:', uploadError?.message);
    } catch (supaErr: any) {
      console.warn('[upload] Supabase bucket exception:', supaErr?.message);
    }

    // 3. Fallback: Save locally to /public/uploads/ so the image is never lost
    try {
      const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '_');
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', cleanFolder);
      await mkdir(uploadsDir, { recursive: true });

      const localFileName = `${Date.now()}_${safeName}.${ext}`;
      const localFilePath = path.join(uploadsDir, localFileName);
      await writeFile(localFilePath, buffer);

      const localPublicUrl = `/uploads/${cleanFolder}/${localFileName}`;

      return NextResponse.json({
        success: true,
        publicUrl: localPublicUrl,
        path: `${cleanFolder}/${localFileName}`,
        bucket: 'local-uploads',
        source: 'local',
        warning: `Saved locally. To sync to Supabase Cloud, ensure "${bucket}" public bucket is created in Supabase.`
      });
    } catch (localErr: any) {
      console.error('[upload] Local fallback failed:', localErr);
      return NextResponse.json(
        { success: false, error: localErr?.message || 'Failed to save image file' },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('[upload] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload
 * Body: JSON { bucket, path }
 * Deletes an image from Supabase Storage or local /public/uploads/ directory.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { bucket, path: filePath } = await req.json();
    if (!filePath) {
      return NextResponse.json({ success: false, error: 'path required' }, { status: 400 });
    }

    if (bucket === 'local-uploads' || filePath.startsWith('/uploads/') || !bucket) {
      try {
        const cleanPath = filePath.replace(/^\/?uploads\//, '');
        const fullLocalPath = path.join(process.cwd(), 'public', 'uploads', cleanPath);
        await unlink(fullLocalPath);
        return NextResponse.json({ success: true, deletedLocal: true });
      } catch {
        // file may not exist, ignore
        return NextResponse.json({ success: true });
      }
    }

    const { client } = getAdminClient();
    const { error } = await client.storage.from(bucket).remove([filePath]);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
