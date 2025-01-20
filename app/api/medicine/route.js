import { NextResponse } from 'next/server';
import models from '../../../lib/schema';
import connectDB from '../../../lib/mongodb';

// Get all medicines or search medicines
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');
    
    let query = {};
    if (searchQuery) {
      query = {
        $or: [
          { medicineName: { $regex: searchQuery, $options: 'i' } },
          { manufacturer: { $regex: searchQuery, $options: 'i' } },
          { category: { $regex: searchQuery, $options: 'i' } }
        ]
      };
    }

    const medicines = await models.MedicineInventory.find(query)
      .sort({ createdAt: -1 });

    console.log('Fetched medicines:', medicines); // Debug log
    return NextResponse.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medicines' },
      { status: 500 }
    );
  }
}

// Add new medicine
export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const {
      name,
      quantity,
      price,
      category,
      manufacturer,
      expiryDate
    } = data;

    // Create new medicine using MedicineInventory model instead of Medicine model
    const medicine = new models.MedicineInventory({
      medicineName: name,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      category,
      manufacturer,
      expiryDate: new Date(expiryDate),
      total: parseFloat(price) * parseInt(quantity)
    });

    await medicine.save();

    return NextResponse.json({
      message: 'Medicine added successfully',
      medicine
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding medicine:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add medicine' },
      { status: 500 }
    );
  }
}

// Update medicine
export async function PUT(request) {
  try {
    await connectDB();
    const data = await request.json();
    const {
      id,
      name,
      quantity,
      price,
      category,
      manufacturer,
      expiryDate
    } = data;

    const medicine = await models.MedicineInventory.findById(id);

    if (!medicine) {
      return NextResponse.json(
        { error: 'Medicine not found' },
        { status: 404 }
      );
    }

    medicine.medicineName = name;
    medicine.quantity = parseInt(quantity);
    medicine.price = parseFloat(price);
    medicine.category = category;
    medicine.manufacturer = manufacturer;
    medicine.expiryDate = new Date(expiryDate);
    medicine.total = parseFloat(price) * parseInt(quantity);

    await medicine.save();

    return NextResponse.json({
      message: 'Medicine updated successfully',
      medicine
    });

  } catch (error) {
    console.error('Error updating medicine:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update medicine' },
      { status: 500 }
    );
  }
}

// Delete medicine
export async function DELETE(request) {
  try {
    await connectDB();
    const data = await request.json();
    const { id } = data;

    const medicine = await models.MedicineInventory.findByIdAndDelete(id);

    if (!medicine) {
      return NextResponse.json(
        { error: 'Medicine not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Medicine deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting medicine:', error);
    return NextResponse.json(
      { error: 'Failed to delete medicine' },
      { status: 500 }
    );
  }
}

// Search medicines by category
export async function PATCH(request) {
  try {
    await connectDB();
    const data = await request.json();
    const { category } = data;

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    const medicines = await models.MedicineInventory.find({
      category: { $regex: category, $options: 'i' }
    }).sort({ createdAt: -1 });

    return NextResponse.json(medicines);

  } catch (error) {
    console.error('Error searching medicines:', error);
    return NextResponse.json(
      { error: 'Failed to search medicines' },
      { status: 500 }
    );
  }
} 