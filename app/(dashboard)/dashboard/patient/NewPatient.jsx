"use client"
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

import axios from 'axios'

export default function NewPatient() {
  const [medicineData, setMedicineData] = useState([])
  const [formData, setFormData] = useState({
    patientId: 'PT' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    name: '',
    age: '',
    contact: '',
    doctor: '',
  })
  const [selectedMedicines, setSelectedMedicines] = useState([])
  const [currentMedicine, setCurrentMedicine] = useState({
    medicine: '',
    quantity: 1,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()
  const [medicineSearch, setMedicineSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showCustomDoctor, setShowCustomDoctor] = useState(false)
  const [customDoctorName, setCustomDoctorName] = useState('')
  
  const filteredMedicines = medicineData.filter(medicine => 
    medicine.medicineName.toLowerCase().includes(medicineSearch.toLowerCase())
  )
  
  const doctors = [
    { id: 'dr1', name: 'Dr. John Smith' },
    { id: 'dr2', name: 'Dr. Sarah Johnson' },
    { id: 'dr3', name: 'Dr. Michael Brown' },
  ]
  
  useEffect(() => {
    const fetchMedicines = async () => {
      setIsLoading(true)
      try {
        const response = await axios.get('/api/medicine')
        console.log('Fetched medicines:', response.data)
        if (Array.isArray(response.data)) {
          setMedicineData(response.data)
        } else {
          //console.error('Invalid medicine data format:', response.data)
          toast.error('Failed to load medicines')
        }
      } catch (error) {
        //console.error('Error fetching medicines:', error)
        toast.error('Failed to fetch medicines')
      } finally {
        setIsLoading(false)
      }
    }
    fetchMedicines()
  }, [showSuccess])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.medicine-dropdown')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen])

  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name) newErrors.name = 'Patient name is required'
    if (!formData.age) newErrors.age = 'Age is required'
    if (!formData.contact) {
      newErrors.contact = 'Contact number is required'
    } else if (!/^\d{10}$/.test(formData.contact)) {
      newErrors.contact = 'Please enter a valid 10-digit contact number'
    }
    if (!formData.doctor) {
      newErrors.doctor = 'Please select or enter a doctor'
    }
    if (selectedMedicines.length === 0) {
      newErrors.medicines = 'Please add at least one medicine'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      console.log('New patient submitted', {
        ...formData,
        medicines: selectedMedicines,
        totalBill: calculateTotal(),
      })
      const storeNewPatient = async () => {
        try {
          const response = await axios.post('/api/newpatient', {
            ...formData,
            medicines: selectedMedicines.map(med => ({
              id: med.id,
              name: med.name,
              quantity: parseInt(med.quantity),
              price: parseFloat(med.price),
              total: parseFloat(med.total)
            })),
            totalBill: parseFloat(calculateTotal())
          });
          console.log('New patient stored successfully:', response.data);
          
          // Generate and download bill
          const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
          });

          // Add Medicare header
          doc.setFontSize(24);
          doc.setTextColor(79, 70, 229); // #4f46e5
          doc.text('Medicare', 140, 20, { align: 'center' });
          doc.setFontSize(12);
          doc.setTextColor(107, 114, 128); // #6b7280
          doc.text('Your Trusted Healthcare Partner', 140, 28, { align: 'center' });

          // Add patient information
          doc.setFontSize(14);
          doc.setTextColor(79, 70, 229);
          doc.text('Patient Information', 20, 45);
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(`Patient ID: ${formData.patientId}`, 20, 55);
          doc.text(`Name: ${formData.name}`, 20, 62);
          doc.text(`Age: ${formData.age}`, 20, 69);
          doc.text(`Contact: ${formData.contact}`, 20, 76);
          doc.text(`Doctor: ${formData.doctor}`, 20, 83);

          // Add bill information
          doc.setFontSize(14);
          doc.setTextColor(79, 70, 229);
          doc.text('Bill Information', 140, 45);
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(`Bill ID: ${response.data._id}`, 140, 55);
          doc.text(`Date: ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}`, 140, 62);
          doc.text('Status: Paid', 140, 69);

          // Add medicines table
          const tableData = selectedMedicines.map(med => [
            med.name,
            med.quantity.toString(),
            formatCurrency(med.price),
            formatCurrency(med.total)
          ]);

          // Add total row
          tableData.push(['', '', 'Total Amount:', formatCurrency(calculateTotal())]);

          doc.autoTable({
            startY: 95,
            head: [['Medicine', 'Quantity', 'Price', 'Total']],
            body: tableData,
            headStyles: {
              fillColor: [79, 70, 229],
              textColor: 255,
              fontSize: 10,
              fontStyle: 'bold'
            },
            styles: {
              fontSize: 10,
              cellPadding: 5
            },
            columnStyles: {
              0: { cellWidth: 80 },
              1: { cellWidth: 30 },
              2: { cellWidth: 40 },
              3: { cellWidth: 40 }
            },
            footStyles: {
              fillColor: [243, 244, 246],
              textColor: 0,
              fontSize: 10,
              fontStyle: 'bold'
            }
          });

          // Add footer
          const pageHeight = doc.internal.pageSize.height;
          doc.setFontSize(10);
          doc.setTextColor(107, 114, 128);
          doc.text('Thank you for choosing Medicare', 140, pageHeight - 20, { align: 'center' });
          doc.text('For any queries, please contact us at: support@medicare.com', 140, pageHeight - 15, { align: 'center' });

          // Download the PDF
          doc.save(`bill-${formData.patientId}.pdf`);
          
          // Show success message
          toast.success('Patient registered successfully');
          setShowSuccess(true);
          
          // Clear form data and generate new patient ID
          setFormData({
            patientId: 'PT' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            name: '',
            age: '',
            contact: '',
            doctor: '',
          });
          
          // Clear selected medicines
          setSelectedMedicines([]);
          
          // Reset current medicine selection
          setCurrentMedicine({
            medicine: '',
            quantity: 1
          });
          
          // Clear any errors
          setErrors({});

          // Refresh medicine data
          const fetchMedicines = async () => {
            setIsLoading(true)
            try {
              const response = await axios.get('/api/medicine')
              if (Array.isArray(response.data)) {
                setMedicineData(response.data)
              } else {
                toast.error('Failed to load medicines')
              }
            } catch (error) {
              toast.error('Failed to fetch medicines')
            } finally {
              setIsLoading(false)
            }
          }
          await fetchMedicines();
          
        } catch (error) {
          console.error('Error storing new patient:', error);
          toast.error(error.response?.data?.error || 'Failed to register patient');
        }
      };

      storeNewPatient();
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleAddMedicine = (e) => {
    e.preventDefault()
    if (!currentMedicine.medicine || currentMedicine.quantity < 1) {
      toast.error('Please select a medicine and quantity')
      return
    }

    const selectedMedicine = medicineData.find(m => m._id === currentMedicine.medicine)
    if (!selectedMedicine) {
      toast.error('Selected medicine not found')
      return
    }

    const existingMedicine = selectedMedicines.find(m => m.id === selectedMedicine._id)
    if (existingMedicine) {
      toast.error('This medicine is already added')
      return
    }

    if (currentMedicine.quantity > selectedMedicine.quantity) {
      toast.error(`Only ${selectedMedicine.quantity} units available in stock`)
      return
    }

    setSelectedMedicines(prev => [...prev, {
      id: selectedMedicine._id,
      name: selectedMedicine.medicineName,
      quantity: parseInt(currentMedicine.quantity),
      price: selectedMedicine.price,
      total: selectedMedicine.price * parseInt(currentMedicine.quantity)
    }])

    setCurrentMedicine({
      medicine: '',
      quantity: 1
    })

    if (errors.medicines) {
      setErrors(prev => ({ ...prev, medicines: '' }))
    }

    toast.success('Medicine added to list')
  }

  const removeMedicine = (index) => {
    setSelectedMedicines(prev => prev.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return selectedMedicines.reduce((sum, item) => sum + item.total, 0).toFixed(2)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  const handleDoctorChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setShowCustomDoctor(true);
      setFormData(prev => ({ ...prev, doctor: '' }));
    } else {
      setShowCustomDoctor(false);
      setCustomDoctorName('');
      setFormData(prev => ({ ...prev, doctor: value }));
    }
  };

  const handleCustomDoctorChange = (e) => {
    setCustomDoctorName(e.target.value);
    setFormData(prev => ({ ...prev, doctor: e.target.value }));
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-8 space-y-8 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center flex-1"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            New Patient Registration
          </h2>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2"
        >
          <span>← Back to Dashboard</span>
        </motion.button>
      </div>

      <form onSubmit={handleSubmit} onKeyPress={handleKeyPress} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient ID (Auto-generated)
          </label>
          <input
            type="text"
              value={formData.patientId}
            readOnly
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-500"
          />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient Name
          </label>
          <input
            type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
            />
            {errors.name && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-1 text-sm text-red-500"
              >
                {errors.name}
              </motion.p>
            )}
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age
          </label>
          <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 rounded-lg border ${errors.age ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
            />
            {errors.age && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-1 text-sm text-red-500"
              >
                {errors.age}
              </motion.p>
            )}
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Number
          </label>
          <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 rounded-lg border ${errors.contact ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
            />
            {errors.contact && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-1 text-sm text-red-500"
              >
                {errors.contact}
              </motion.p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor
            </label>
            {!showCustomDoctor ? (
              <select
                name="doctor"
                value={formData.doctor}
                onChange={handleDoctorChange}
                className={`w-full px-4 py-2 rounded-lg border ${errors.doctor ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
              >
                <option value="">Select a doctor</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.name}>
                    {doctor.name}
                  </option>
                ))}
                <option value="custom">Enter custom doctor name</option>
              </select>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customDoctorName}
                  onChange={handleCustomDoctorChange}
                  placeholder="Enter doctor name"
                  className={`w-full px-4 py-2 rounded-lg border ${errors.doctor ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomDoctor(false);
                    setCustomDoctorName('');
                    setFormData(prev => ({ ...prev, doctor: '' }));
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  ← Back to dropdown
                </button>
              </div>
            )}
            {errors.doctor && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-1 text-sm text-red-500"
              >
                {errors.doctor}
              </motion.p>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Add Medicines</h3>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative medicine-dropdown">
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer bg-white flex justify-between items-center"
              >
                <span className="text-gray-700">
                  {currentMedicine.medicine 
                    ? filteredMedicines.find(m => m._id === currentMedicine.medicine)?.medicineName 
                    : 'Select Medicine'}
                </span>
                <span className="text-gray-400">▼</span>
              </div>
              
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-300">
                    <input
                      type="text"
                      placeholder="Search medicines..."
                      value={medicineSearch}
                      onChange={(e) => setMedicineSearch(e.target.value)}
                      className="w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="py-1">
                    {isLoading ? (
                      <div className="px-4 py-2 text-gray-500">Loading medicines...</div>
                    ) : filteredMedicines.length === 0 ? (
                      <div className="px-4 py-2 text-gray-500">No medicines found</div>
                    ) : (
                      filteredMedicines.map(medicine => (
                        <div
                          key={medicine._id}
                          onClick={() => {
                            setCurrentMedicine(prev => ({ ...prev, medicine: medicine._id }))
                            setIsDropdownOpen(false)
                            setMedicineSearch('')
                          }}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                            medicine.quantity === 0 ? 'text-gray-400' : 'text-gray-700'
                          }`}
                          style={{ pointerEvents: medicine.quantity === 0 ? 'none' : 'auto' }}
                        >
                          {medicine.medicineName} - {formatCurrency(medicine.price)} ({medicine.quantity} in stock)
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <input
              type="number"
              min="1"
              value={currentMedicine.quantity}
              onChange={(e) => setCurrentMedicine(prev => ({ ...prev, quantity: e.target.value }))}
              className="w-24 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddMedicine}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              Add
            </motion.button>
          </div>

          {errors.medicines && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1 text-sm text-red-500"
            >
              {errors.medicines}
            </motion.p>
          )}

          <AnimatePresence mode="popLayout">
            {selectedMedicines.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-4 border rounded-lg overflow-hidden"
              >
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedMedicines.map((item, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td className="px-6 py-4">{item.name}</td>
                        <td className="px-6 py-4">{item.quantity}</td>
                        <td className="px-6 py-4">{formatCurrency(item.price)}</td>
                        <td className="px-6 py-4">{formatCurrency(item.total)}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => removeMedicine(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan="3" className="px-6 py-4 text-right font-bold">Total Bill:</td>
                      <td className="px-6 py-4 font-bold">{formatCurrency(calculateTotal())}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
          >
            Register Patient and Generate Bill
          </motion.button>

          {showSuccess && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
            >
              Go to Dashboard
            </motion.button>
          )}
        </div>
      </form>
    </div>
  )
}

