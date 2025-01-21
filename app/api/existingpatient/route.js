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

    // Search by patientId or contact number and sort bills by date in descending order
    const patient = await models.Patient.findOne({
      $or: [
        { patientId: searchQuery },
        { contact: searchQuery }
      ]
    }).then(patient => {
      if (patient) {
        // Sort bills array in descending order by createdAt
        patient.bills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return patient;
    });

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

    // Check stock availability for all medicines
    const stockChecks = await Promise.all(medicines.map(async (med) => {
      const medicineInDb = await models.MedicineInventory.findById(med.id);
      if (!medicineInDb) {
        throw new Error(`Medicine ${med.medicineName} not found`);
      }
      if (medicineInDb.quantity < med.quantity) {
        throw new Error(`Insufficient stock for ${med.medicineName}. Only ${medicineInDb.quantity} available`);
      }
      return medicineInDb;
    }));

    // Create new bill
    const newBill = {
      medicines: medicines.map(med => ({
        medicineName: med.medicineName,
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

    // Update stock levels and collect alerts
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

      // Send email notification
      await fetch('http://localhost:3000/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: 'Medical Inventory Alert - Action Required',
          content: emailContent
        })
      });
    }

    return NextResponse.json({
      message: 'Bill added successfully',
      patient
    }, { status: 200 });

  } catch (error) {
    console.error('Error adding bill:', error);
    
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