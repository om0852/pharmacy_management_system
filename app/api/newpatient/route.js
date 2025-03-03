import { NextResponse } from 'next/server';
import models from '../../../lib/schema';
import {connectDB} from '../../../lib/mongodb';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'smartcoder0852@gmail.com',
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { patientId, name, age, contact, doctor, medicines, totalBill } = body;

    // Validate required fields
    if (!patientId || !name || !age || !contact || !doctor || !medicines || !totalBill) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Create new patient with doctor field
    const patient = new models.Patient({
      patientId,
      name,
      age: parseInt(age),
      contact,
      doctor,
      bills: [{
        medicines: medicines.map(med => ({
          medicineName: med.name,
          quantity: med.quantity,
          price: med.price,
          total: med.total
        })),
        totalAmount: totalBill,
        status: 'Paid'
      }]
    });

    // Save patient
    await patient.save();

    // Update medicine stock
    for (const medicine of medicines) {
      const medicineDoc = await models.MedicineInventory.findById(medicine.id);
      if (!medicineDoc) {
        throw new Error(`Medicine not found: ${medicine.name}`);
      }

      if (medicineDoc.quantity < medicine.quantity) {
        throw new Error(`Insufficient stock for ${medicine.name}`);
      }

      medicineDoc.quantity -= medicine.quantity;
      await medicineDoc.save();
    }

    return NextResponse.json(
      { message: 'Patient created successfully', patient },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating patient:', error);

    if (error.message.includes('Insufficient stock') || error.message.includes('Medicine not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Patient ID already exists' },
        { status: 400 }
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
