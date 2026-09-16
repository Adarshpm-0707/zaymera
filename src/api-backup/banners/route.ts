import { NextRequest, NextResponse } from 'next/server';
import {
  fetchBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  fetchStoreSettings,
  updateStoreSettings,
} from '@/lib/supabase/services';

export const dynamic = 'force-dynamic';

// GET /api/banners — list all active banners and store settings
export async function GET() {
  try {
    const [bannersRes, settingsRes] = await Promise.all([
      fetchBanners(),
      fetchStoreSettings(),
    ]);

    return NextResponse.json({
      success: true,
      banners: bannersRes.data || [],
      settings: settingsRes.data || null,
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

// POST /api/banners — create a new banner
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.title) {
      return NextResponse.json(
        { success: false, error: 'title is required' },
        { status: 400 }
      );
    }

    const result = await createBanner({
      title: body.title,
      subtitle: body.subtitle || '',
      image: body.image || '',
      link: body.link || '',
      sortOrder: body.sortOrder ?? 0,
      active: body.active ?? true,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create banner' },
      { status: 500 }
    );
  }
}

// PATCH /api/banners — update store settings OR a specific banner
// Body: { type: 'settings', ...settings } or { type: 'banner', id, ...updates }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (body?.type === 'settings') {
      const { type, ...settings } = body;
      await updateStoreSettings(settings);
      return NextResponse.json({ success: true, message: 'Settings updated' }, { status: 200 });
    }

    if (body?.type === 'banner' && body?.id) {
      const { type, id, ...updates } = body;
      await updateBanner(id, updates);
      return NextResponse.json({ success: true, message: 'Banner updated' }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: 'Provide type: "settings" or type: "banner" with id' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update' },
      { status: 500 }
    );
  }
}

// DELETE /api/banners?id=ban-xxx — delete a banner by ID
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id query param required' },
        { status: 400 }
      );
    }

    await deleteBanner(id);
    return NextResponse.json({ success: true, message: 'Banner deleted' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
