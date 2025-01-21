import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import models from '../../../../lib/schema';

export async function GET() {
  try {
    await connectDB();
    console.log('Connected to MongoDB'); // Debug log

    // Get total patients
    const totalPatients = await models.Patient.countDocuments();
    console.log('Total patients:', totalPatients); // Debug log

    // Get today's income
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIncome = await models.Patient.aggregate([
      { $unwind: '$bills' },
      {
        $match: {
          'bills.createdAt': { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$bills.totalAmount' }
        }
      }
    ]);
    console.log('Today income:', todayIncome); // Debug log

    // Get monthly income
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyIncome = await models.Patient.aggregate([
      { $unwind: '$bills' },
      {
        $match: {
          'bills.createdAt': { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$bills.totalAmount' }
        }
      }
    ]);
    console.log('Monthly income:', monthlyIncome); // Debug log

    // Get monthly income data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyIncomeData = await models.Patient.aggregate([
      { $unwind: '$bills' },
      {
        $match: {
          'bills.createdAt': { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$bills.createdAt' },
            month: { $month: '$bills.createdAt' }
          },
          income: { $sum: '$bills.totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    console.log('Monthly income data:', monthlyIncomeData); // Debug log

    // Format monthly data for chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlyData = monthlyIncomeData.map(item => ({
      month: months[item._id.month - 1],
      income: item.income
    }));

    // Get low stock and expiring stock counts
    const lowStock = await models.MedicineInventory.countDocuments({ quantity: { $lte: 10 } });
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    const expiringStock = await models.MedicineInventory.countDocuments({
      expiryDate: { $lte: oneMonthFromNow }
    });
    console.log('Stock counts:', { lowStock, expiringStock }); // Debug log

    // Get recent transactions
    const recentTransactions = await models.Patient.aggregate([
      { $unwind: '$bills' },
      { $sort: { 'bills.createdAt': -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: { $toString: '$_id' },
          patientName: '$name',
          date: '$bills.createdAt',
          amount: '$bills.totalAmount',
          status: { $literal: 'Paid' }
        }
      }
    ]);
    console.log('Recent transactions:', recentTransactions); // Debug log

    const response = {
      totalPatients,
      todayIncome: todayIncome[0]?.total || 0,
      monthlyIncome: monthlyIncome[0]?.total || 0,
      lowStock,
      expiringStock,
      monthlyIncomeData: formattedMonthlyData,
      recentTransactions
    };
    console.log('Final response:', response); // Debug log

    return NextResponse.json(response);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 