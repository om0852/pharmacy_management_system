import { NextResponse } from 'next/server';
import models from '../../../lib/schema';
import connectDB from '../../../lib/mongodb';

// GET patient by ID or contact number
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');
    
    if (!searchQuery) {
      return NextResponse.json(
        { error: 'Search parameter is required' },
        { status: 400 }
      );
    }

    // Search by patientId or contact number
    const patient = await models.Patient.findOne({
      $or: [
        { patientId: searchQuery },
        { contact: searchQuery }
      ]
    }).sort({ createdAt: -1 });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

// Add new bill to existing patient
export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const {
      patientId,
      medicines,
      totalBill
    } = data;

    // Find the patient
    const patient = await models.Patient.findOne({ patientId });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Create new bill
    const newBill = {
      medicines: medicines.map(med => ({
        medicineName: med.name,
        quantity: parseInt(med.quantity),
        price: parseFloat(med.price),
        total: parseFloat(med.total)
      })),
      totalAmount: parseFloat(totalBill),
      status: 'Paid'
    };

    // Add bill to patient's bills array
    patient.bills.push(newBill);
    await patient.save();

    return NextResponse.json({
      message: 'Bill added successfully',
      patient
    }, { status: 200 });

  } catch (error) {
    console.error('Error adding bill:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add bill' },
      { status: 500 }
    );
  }
}

// Get patient history
export async function PUT(request) {
  try {
    await connectDB();
    const data = await request.json();
    const { patientId } = data;

    const patient = await models.Patient.findOne({ patientId })
      .select('bills')
      .sort({ 'bills.createdAt': -1 });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      bills: patient.bills,
      totalBills: patient.calculateTotalBills()
    });

  } catch (error) {
    console.error('Error fetching patient history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient history' },
      { status: 500 }
    );
  }
}

// Search patients
export async function PATCH(request) {
  try {
    await connectDB();
    const data = await request.json();
    const { query } = data;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const patients = await models.Patient.find({
      $or: [
        { patientId: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
        { contact: { $regex: query, $options: 'i' } }
      ]
    }).limit(10).sort({ createdAt: -1 });

    return NextResponse.json(patients);

  } catch (error) {
    console.error('Error searching patients:', error);
    return NextResponse.json(
      { error: 'Failed to search patients' },
      { status: 500 }
    );
  }
}

// Delete bill
export async function DELETE(request) {
  try {
    await connectDB();
    const data = await request.json();
    const { patientId, billId } = data;

    const patient = await models.Patient.findOne({ patientId });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Remove the bill
    patient.bills = patient.bills.filter(bill => bill._id.toString() !== billId);
    await patient.save();

    return NextResponse.json({
      message: 'Bill deleted successfully',
      patient
    });

  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json(
      { error: 'Failed to delete bill' },
      { status: 500 }
    );
  }
} 