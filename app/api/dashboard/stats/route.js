import { NextResponse } from 'next/server';
import models from '../../../../lib/schema';
import connectDB from '../../../../lib/mongodb';

export async function GET() {
  try {
    await connectDB();

    // Get total patients
    const totalPatients = await models.Patient.countDocuments();

    // Get low stock medicines
    const lowStock = await models.MedicineInventory.countDocuments({
      quantity: { $lte: 10 }
    });

    // Get expiring medicines (within next month)
    const today = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(today.getMonth() + 1);
    
    const expiringStock = await models.MedicineInventory.countDocuments({
      expiryDate: {
        $gte: today,
        $lte: oneMonthFromNow
      }
    });

    // Calculate total income
    const allBills = await models.Patient.aggregate([
      { $unwind: '$bills' },
      {
        $group: {
          _id: null,
          total: { $sum: '$bills.totalAmount' }
        }
      }
    ]);
    const totalIncome = allBills[0]?.total || 0;

    // Calculate today's income
    today.setHours(0, 0, 0, 0);
    const todayBills = await models.Patient.aggregate([
      { $unwind: '$bills' },
      {
        $match: {
          'bills.createdAt': {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
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
    const todayIncome = todayBills[0]?.total || 0;

    // Calculate this month's income
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    
    const monthBills = await models.Patient.aggregate([
      { $unwind: '$bills' },
      {
        $match: {
          'bills.createdAt': {
            $gte: firstDayOfMonth,
            $lte: lastDayOfMonth
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
    const monthIncome = monthBills[0]?.total || 0;

    // Get recent transactions with unique IDs
    const recentTransactions = await models.Patient.aggregate([
      { $unwind: '$bills' },
      { $sort: { 'bills.createdAt': -1 } },
      { $limit: 10 },
      {
        $project: {
          id: { $toString: '$_id' }, // Convert ObjectId to string
          date: '$bills.createdAt',
          patientName: '$name',
          amount: '$bills.totalAmount',
          status: '$bills.status',
          billId: { $toString: '$bills._id' } // Add unique bill ID
        }
      }
    ]);

    return NextResponse.json({
      stats: {
        totalPatients,
        lowStock,
        expiringStock,
        totalIncome,
        todayIncome,
        monthIncome
      },
      recentTransactions
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 