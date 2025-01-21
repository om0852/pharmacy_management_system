import mongoose from 'mongoose';

// Medicine Schema
const medicineSchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number }
});

// Bill Schema
const billSchema = new mongoose.Schema({
  medicines: [medicineSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending'], default: 'Paid' },
  createdAt: { type: Date, default: Date.now }
});

// Patient Schema
const patientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  contact: { type: String, required: true },
  email: String,
  address: String,
  bills: [billSchema]
}, { timestamps: true });

// Medicine Inventory Schema
const medicineInventorySchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  manufacturer: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  category: String,
  expiryDate: { type: Date, required: true }
}, { timestamps: true });

// Create or get models
const models = {};

try {
  // Try to get existing models
  models.Patient = mongoose.model('Patient');
  models.MedicineInventory = mongoose.model('MedicineInventory');
} catch {
  // Create new models if they don't exist
  models.Patient = mongoose.model('Patient', patientSchema);
  models.MedicineInventory = mongoose.model('MedicineInventory', medicineInventorySchema);
}

export default models;
