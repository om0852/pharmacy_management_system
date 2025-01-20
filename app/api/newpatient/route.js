import { NextResponse } from 'next/server';
import models from '../../../lib/schema';
import connectDB from '../../../lib/mongodb';

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const {
      patientId,
      name,
      age,
      contact,
      medicines,
      totalBill,
      email,
      address
    } = data;

    // Create new patient with bill and medicines
    const patient = new models.Patient({
      patientId,
      name,
      age,
      contact,
      email,
      address,
      bills: [{
        medicines: medicines.map(med => ({
          medicineName: med.name,
          quantity: parseInt(med.quantity),
          price: parseFloat(med.price),
          total: parseFloat(med.total)
        })),
        totalAmount: parseFloat(totalBill),
        status: 'Paid'
      }]
    });

    // Save the patient
    await patient.save();

    return NextResponse.json({
      message: 'Patient created successfully',
      patient
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating patient:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Patient ID already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const patients = await models.Patient.find({})
      .sort({ createdAt: -1 });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}
