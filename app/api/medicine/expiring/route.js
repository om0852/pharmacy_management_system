import { NextResponse } from 'next/server';
import models from '../../../../lib/schema';
import {connectDB }from '../../../../lib/mongodb';

export async function GET() {
  try {
    await connectDB();
    const today = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(today.getMonth() + 1);

    const medicines = await models.MedicineInventory.find({
      expiryDate: {
        $gte: today,
        $lte: oneMonthFromNow
      }
    }).sort({ expiryDate: 1 });

    return NextResponse.json(medicines);
  } catch (error) {
    console.error('Error fetching expiring medicines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expiring medicines' },
      { status: 500 }
    );
  }
} 