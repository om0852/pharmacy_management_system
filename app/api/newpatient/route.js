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

    // Check for duplicate contact number
    const existingPatient = await models.Patient.findOne({ contact });
    if (existingPatient) {
      return NextResponse.json(
        { error: 'A patient with this contact number already exists' },
        { status: 400 }
      );
    }

    // Check stock availability for all medicines
    const stockChecks = await Promise.all(medicines.map(async (med) => {
      const medicineInDb = await models.MedicineInventory.findById(med.id);
      if (!medicineInDb) {
        throw new Error(`Medicine ${med.name} not found`);
      }
      if (medicineInDb.quantity < med.quantity) {
        throw new Error(`Insufficient stock for ${med.name}. Only ${medicineInDb.quantity} available`);
      }
      return medicineInDb;
    }));

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

    // Update stock levels
    const stockUpdates = medicines.map(async (med) => {
      const medicine = await models.MedicineInventory.findById(med.id);
      medicine.quantity -= parseInt(med.quantity);
      await medicine.save();

      let alerts = [];

      // Check if medicine is out of stock
      if (medicine.quantity === 0) {
        alerts.push({
          type: 'out_of_stock',
          medicine: medicine
        });
        // Delete medicine if stock is zero
        await models.MedicineInventory.findByIdAndDelete(medicine._id);
      }
      // Check if stock is low
      else if (medicine.quantity <= 10) {
        alerts.push({
          type: 'low_stock',
          medicine: medicine
        });
      }

      // Check if medicine is expiring within a month
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      if (medicine.expiryDate <= oneMonthFromNow) {
        alerts.push({
          type: 'expiring',
          medicine: medicine
        });
      }

      return alerts;
    });

    const allAlerts = (await Promise.all(stockUpdates)).flat();

    // Send email if there are any alerts
    if (allAlerts.length > 0) {
      const outOfStockMeds = allAlerts
        .filter(alert => alert.type === 'out_of_stock')
        .map(alert => alert.medicine);

      const lowStockMeds = allAlerts
        .filter(alert => alert.type === 'low_stock')
        .map(alert => alert.medicine);

      const expiringMeds = allAlerts
        .filter(alert => alert.type === 'expiring')
        .map(alert => alert.medicine);

      let emailContent = '<h2>Medical Inventory Alert</h2>';

      if (outOfStockMeds.length > 0) {
        emailContent += `
          <h3>Out of Stock Alert</h3>
          <p>The following items are now out of stock and have been removed from inventory:</p>
          <ul>
            ${outOfStockMeds.map(med => `
              <li>${med.medicineName} - Removed from inventory</li>
            `).join('')}
          </ul>
        `;
      }

      if (lowStockMeds.length > 0) {
        emailContent += `
          <h3>Low Stock Alert</h3>
          <p>The following items are running low on stock:</p>
          <ul>
            ${lowStockMeds.map(med => `
              <li>${med.medicineName} - Only ${med.quantity} units remaining</li>
            `).join('')}
          </ul>
        `;
      }

      if (expiringMeds.length > 0) {
        emailContent += `
          <h3>Expiring Stock Alert</h3>
          <p>The following items are expiring within a month:</p>
          <ul>
            ${expiringMeds.map(med => `
              <li>${med.medicineName} - Expires on ${new Date(med.expiryDate).toLocaleDateString()}</li>
            `).join('')}
          </ul>
        `;
      }

      await transporter.sendMail({
        from: 'smartcoder0852@gmail.com',
        to: 'salunkeom474@gmail.com',
        subject: 'Medical Inventory Alert - Action Required',
        html: emailContent
      });
    }

    return NextResponse.json({
      message: 'Patient created successfully',
      patient
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating patient:', error);
    
    if (error.message.includes('Insufficient stock') || error.message.includes('Medicine not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

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
