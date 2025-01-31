import { NextResponse } from 'next/server';
import models from '../../../../../lib/schema';
import {connectDB }from '../../../../../lib/mongodb';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { patientId } = params;

    const patient = await models.Patient.findOne({ patientId })
      .select('patientId name age contact bills')
      .sort({ 'bills.createdAt': -1 });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Calculate total bills
    const totalBills = patient.bills.reduce((sum, bill) => sum + bill.totalAmount, 0);

    return NextResponse.json({
      patient: {
        ...patient.toObject(),
        totalBills
      }
    });

  } catch (error) {
    console.error('Error fetching patient history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient history' },
      { status: 500 }
    );
  }
} 