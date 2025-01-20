import mongoose from 'mongoose';

// Medicine Schema (for medicines in bills)
const MedicineSchema = new mongoose.Schema({
  medicineName: {
    type: String,
    required: [true, 'Medicine name is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total amount is required']
  }
}, {
  timestamps: true
});

// Bill Schema
const BillSchema = new mongoose.Schema({
  medicines: [MedicineSchema],
  totalAmount: {
    type: Number,
    required: [true, 'Total bill amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Cancelled'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

// Patient Schema
const PatientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: [true, 'Patient ID is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    minLength: [2, 'Name must be at least 2 characters long']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [0, 'Age cannot be negative'],
    max: [150, 'Please enter a valid age']
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v); // Validates 10-digit phone numbers
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  bills: [BillSchema],
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return v === '' || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  address: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Add methods to calculate totals
PatientSchema.methods.calculateTotalBills = function() {
  return this.bills.reduce((total, bill) => total + bill.totalAmount, 0);
};

BillSchema.methods.calculateTotal = function() {
  return this.medicines.reduce((total, medicine) => total + medicine.total, 0);
};

// Add middleware to update totals before saving
BillSchema.pre('save', function(next) {
  this.totalAmount = this.medicines.reduce((total, medicine) => total + medicine.total, 0);
  next();
});

MedicineSchema.pre('save', function(next) {
  this.total = this.quantity * this.price;
  next();
});

// Medicine Inventory Schema
const MedicineInventorySchema = new mongoose.Schema({
  medicineName: {
    type: String,
    required: [true, 'Medicine name is required'],
    unique: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream'],
    default: 'tablet'
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
  },
  total: {
    type: Number,
    required: true
  },
  lowStockAlert: {
    type: Number,
    default: 10
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Add virtual for stock status
MedicineInventorySchema.virtual('stockStatus').get(function() {
  if (this.quantity > 50) return 'High';
  if (this.quantity > 20) return 'Medium';
  return 'Low';
});

// Add method to check if reorder is needed
MedicineInventorySchema.methods.needsReorder = function() {
  return this.quantity <= this.lowStockAlert;
};

// Create models
const models = {};

if (mongoose.models) {
  models.Patient = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
  models.Bill = mongoose.models.Bill || mongoose.model('Bill', BillSchema);
  models.Medicine = mongoose.models.Medicine || mongoose.model('Medicine', MedicineSchema);
  models.MedicineInventory = mongoose.models.MedicineInventory || 
    mongoose.model('MedicineInventory', MedicineInventorySchema);
} else {
  models.Patient = mongoose.model('Patient', PatientSchema);
  models.Bill = mongoose.model('Bill', BillSchema);
  models.Medicine = mongoose.model('Medicine', MedicineSchema);
  models.MedicineInventory = mongoose.model('MedicineInventory', MedicineInventorySchema);
}

export default models;
