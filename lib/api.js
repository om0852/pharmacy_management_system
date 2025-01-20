import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Medicine API services
export const medicineApi = {
  // Get all medicines or search
  getAllMedicines: async (searchQuery = '') => {
    try {
      const response = await api.get(`/medicine${searchQuery ? `?search=${searchQuery}` : ''}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add new medicine
  addMedicine: async (medicineData) => {
    try {
      const response = await api.post('/medicine', medicineData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update medicine
  updateMedicine: async (medicineData) => {
    try {
      const response = await api.put('/medicine', medicineData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete medicine
  deleteMedicine: async (id) => {
    try {
      const response = await api.delete('/medicine', { data: { id } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search by category
  searchByCategory: async (category) => {
    try {
      const response = await api.patch('/medicine', { category });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Patient API services
export const patientApi = {
  // Create new patient
  createPatient: async (patientData) => {
    try {
      const response = await api.post('/newpatient', patientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get patient by ID or contact
  getPatient: async (searchQuery) => {
    try {
      const response = await api.get(`/existingpatient?search=${searchQuery}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add bill to existing patient
  addBill: async (billData) => {
    try {
      const response = await api.post('/existingpatient', billData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get patient history
  getPatientHistory: async (patientId) => {
    try {
      const response = await api.put('/existingpatient', { patientId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search patients
  searchPatients: async (query) => {
    try {
      const response = await api.patch('/existingpatient', { query });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete bill
  deleteBill: async (patientId, billId) => {
    try {
      const response = await api.delete('/existingpatient', {
        data: { patientId, billId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// File handling API services
export const fileApi = {
  // Upload file
  uploadFile: async (formData) => {
    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Download file
  downloadFile: async (fileId) => {
    try {
      const response = await api.get(`/download/${fileId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Generate PDF
  generatePDF: async (data) => {
    try {
      const response = await api.post('/generate-pdf', data, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Utility functions
export const utils = {
  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  // Format date
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Generate patient ID
  generatePatientId: () => {
    return `PAT${Date.now().toString().slice(-6)}`;
  },

  // Calculate bill total
  calculateBillTotal: (medicines) => {
    return medicines.reduce((total, med) => total + (med.price * med.quantity), 0);
  },

  // Validate phone number
  validatePhone: (phone) => {
    return /^\d{10}$/.test(phone);
  },

  // Validate email
  validateEmail: (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};

// Error handling
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.error || 'An error occurred';
    const status = error.response.status;
    return { message, status };
  } else if (error.request) {
    // Request made but no response
    return { message: 'No response from server', status: 503 };
  } else {
    // Request setup error
    return { message: error.message, status: 500 };
  }
};

// Custom hooks
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Example usage in components: 