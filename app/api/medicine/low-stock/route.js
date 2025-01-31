import { NextResponse } from 'next/server';
import models from '../../../../lib/schema';
import {connectDB }from '../../../../lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    const medicines = await models.MedicineInventory.find({
      quantity: { $lte: 10 }
    }).sort({ quantity: 1 });

    return NextResponse.json(medicines);
  } catch (error) {
    console.error('Error fetching low stock medicines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch low stock medicines' },
      { status: 500 }
    );
  }
} 