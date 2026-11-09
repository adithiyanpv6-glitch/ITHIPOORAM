import { NextResponse } from 'next/server';
import { db, persistDb } from '@/lib/serverDb';
import { autoDispatchMenuExcelToTelegram } from '@/lib/autoTelegramMenuSync';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(db.menuCategories || [], { 
    headers: {
      ...corsHeaders,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    } 
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, malayalamName, category, priceInr, pricePaise, currentStock, station, dietary, image } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400, headers: corsHeaders });
    }

    const calculatedPricePaise = pricePaise !== undefined 
      ? Number(pricePaise) 
      : Math.round(Number(priceInr || 0) * 100);

    if (calculatedPricePaise <= 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400, headers: corsHeaders });
    }

    const categoryName = (category || 'Special Delicacies').trim();
    let targetCat = db.menuCategories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!targetCat) {
      targetCat = {
        id: `cat-${Date.now()}`,
        name: categoryName,
        malayalamName: malayalamName || categoryName,
        items: [],
      };
      db.menuCategories.push(targetCat);
    }

    const newItem: any = {
      id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      malayalamName: (malayalamName || '').trim(),
      pricePaise: calculatedPricePaise,
      isAvailable: true,
      currentStock: currentStock !== null && currentStock !== undefined && currentStock !== '' ? Number(currentStock) : null,
      station: station || 'Main Kitchen',
      dietary: dietary || 'SEAFOOD',
      image: image || '',
      category: targetCat.name,
    };

    targetCat.items.push(newItem);

    // Save state to disk immediately
    persistDb();

    // Audit log entry
    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actionType: 'MENU_ITEM_ADDED',
      module: 'MENU',
      usernameSnapshot: 'Menu Manager',
      reason: `Added new dish "${newItem.name}" to ${targetCat.name} for ₹${(newItem.pricePaise / 100).toFixed(2)}`,
      success: true,
    });

    // Automatically update Datewise Menu Database and dispatch Excel to Telegram
    try {
      await autoDispatchMenuExcelToTelegram(`New Dish Added: ${newItem.name} (₹${(newItem.pricePaise / 100).toFixed(2)})`);
    } catch (tgErr) {
      console.error('Menu telegram auto-dispatch error:', tgErr);
    }

    return NextResponse.json({ success: true, item: newItem, categories: db.menuCategories }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (Array.isArray(body.categories)) {
      db.menuCategories = body.categories;
      persistDb();
      return NextResponse.json({ success: true, categories: db.menuCategories }, { headers: corsHeaders });
    }
    return NextResponse.json({ error: 'categories must be an array' }, { status: 400, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { itemId, isAvailable, currentStock, pricePaise, reason } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400, headers: corsHeaders });
    }

    let updatedItem: any = null;
    for (const cat of db.menuCategories) {
      const it = cat.items.find((item) => item.id === itemId);
      if (it) {
        if (typeof isAvailable === 'boolean') it.isAvailable = isAvailable;
        if (currentStock !== undefined) it.currentStock = currentStock;
        if (pricePaise !== undefined) it.pricePaise = pricePaise;
        updatedItem = it;
        break;
      }
    }

    if (!updatedItem) {
      return NextResponse.json({ error: 'Item not found in live menu' }, { status: 404, headers: corsHeaders });
    }

    // Save state to disk immediately
    persistDb();

    // Add audit log entry
    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actionType: pricePaise !== undefined ? 'MENU_PRICE_CHANGED' : 'MENU_AVAILABILITY_CHANGED',
      module: 'MENU',
      usernameSnapshot: 'Menu Manager',
      reason: reason || `Updated item ${updatedItem.name}`,
      success: true,
    });

    // Automatically update Datewise Menu Database and dispatch Excel to Telegram
    try {
      await autoDispatchMenuExcelToTelegram(`Menu Item Updated: ${updatedItem.name}`);
    } catch (tgErr) {
      console.error('Menu telegram auto-dispatch error:', tgErr);
    }

    return NextResponse.json({ success: true, item: updatedItem }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'itemId query param is required' }, { status: 400, headers: corsHeaders });
    }

    let deletedName = '';
    for (const cat of db.menuCategories) {
      const idx = cat.items.findIndex((it) => it.id === itemId);
      if (idx !== -1) {
        deletedName = cat.items[idx].name;
        cat.items.splice(idx, 1);
        break;
      }
    }

    // Filter out categories that are now empty
    db.menuCategories = db.menuCategories.filter((c) => c.items.length > 0);

    persistDb();

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actionType: 'MENU_ITEM_DELETED',
      module: 'MENU',
      usernameSnapshot: 'Menu Manager',
      reason: `Deleted dish "${deletedName}"`,
      success: true,
    });

    return NextResponse.json({ success: true, deletedName, categories: db.menuCategories }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
