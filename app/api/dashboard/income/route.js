import { NextResponse } from 'next/server';
import models from '../../../../lib/schema';
import connectDB from '../../../../lib/mongodb';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const startDate = new Date(searchParams.get('startDate'));
    const endDate = new Date(searchParams.get('endDate'));

    const rangeBills = await models.Patient.aggregate([
      { $unwind: '$bills' },
      {
        $match: {
          'bills.createdAt': {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$bills.totalAmount' }
        }
      }
    ]);

    return NextResponse.json({
      income: rangeBills[0]?.total || 0
    });

  } catch (error) {
    console.error('Error fetching range income:', error);
    return NextResponse.json(
      { error: 'Failed to fetch range income' },
      { status: 500 }
    );
  }
} 