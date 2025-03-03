"use client"
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import axios from 'axios'

// Sample patient data - replace with your actual data source

export default function ExistingPatient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedMedicines, setSelectedMedicines] = useState([])
  const [currentMedicine, setCurrentMedicine] = useState({
    medicine: '',
    quantity: 1,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [medicines, setMedicines] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [medicineSearch, setMedicineSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showCustomDoctor, setShowCustomDoctor] = useState(false)
  const [customDoctorName, setCustomDoctorName] = useState('')
  const [doctor, setDoctor] = useState('')

  const doctors = [
    { id: 'dr1', name: 'Dr. John Smith' },
    { id: 'dr2', name: 'Dr. Sarah Johnson' },
    { id: 'dr3', name: 'Dr. Michael Brown' },
  ]

  const router = useRouter()

  // Fetch all medicines on component mount
  useEffect(() => {
    fetchMedicines()
  }, [])

  // Fetch medicines
  const fetchMedicines = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/medicine')
      setMedicines(response.data)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch medicines')
    } finally {
      setLoading(false)
    }
  }

  // Search patient
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setErrors({ search: 'Please enter a patient ID or contact number' })
      return
    }

    try {
      setLoading(true)
      const response = await axios.get(`/api/existingpatient?search=${searchQuery}`)
      const patient = response.data
      setSelectedPatient(patient)
      setErrors({})
      
      if (!patient) {
        setErrors({ search: 'No patient found with this ID/contact number' })
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to find patient')
      setErrors({ search: 'Failed to find patient' })
    } finally {
      setLoading(false)
    }
  }

  // Add medicine to bill
  const handleAddMedicine = (e) => {
    e.preventDefault()
    if (!currentMedicine.medicine || currentMedicine.quantity < 1) {
      toast.error('Please select a medicine and quantity')
      return
    }

    const selectedMedicine = medicines.find(m => m._id === currentMedicine.medicine)
    if (!selectedMedicine) {
      toast.error('Selected medicine not found')
      return
    }

    // Check if requested quantity is available in stock
    if (currentMedicine.quantity > selectedMedicine.quantity) {
      toast.error(`Only ${selectedMedicine.quantity} units available in stock`)
      return
    }

    // Check if medicine is already added
    const existingMedicine = selectedMedicines.find(m => m.id === selectedMedicine._id)
    if (existingMedicine) {
      toast.error('This medicine is already added')
      return
    }

    setSelectedMedicines(prev => [...prev, {
      id: selectedMedicine._id,
      medicineName: selectedMedicine.medicineName,
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

  // Remove medicine from bill
  const removeMedicine = (index) => {
    setSelectedMedicines(prev => prev.filter((_, i) => i !== index))
  }

  // Calculate total bill
  const calculateTotal = () => {
    return selectedMedicines.reduce((sum, item) => sum + item.total, 0).toFixed(2)
  }

  // Generate bill
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPatient) {
      setErrors({ search: 'Please select a patient first' })
      return
    }
    if (selectedMedicines.length === 0) {
      setErrors({ medicines: 'Please add at least one medicine' })
      return
    }
    if (!doctor) {
      setErrors({ doctor: 'Please select or enter a doctor' })
      return
    }

    try {
      setLoading(true)
      const billData = {
        patientId: selectedPatient.patientId,
        name: selectedPatient.name,
        age: selectedPatient.age,
        contact: selectedPatient.contact,
        doctor: doctor,
        medicines: selectedMedicines.map(med => ({
          id: med.id,
          medicineName: med.medicineName,
          quantity: parseInt(med.quantity),
          price: parseFloat(med.price),
          total: parseFloat(med.total)
        })),
        totalBill: parseFloat(calculateTotal())
      }

      const response = await axios.post('/api/existingpatient', billData)
      toast.success('Bill generated successfully')
      setShowSuccess(true)
      
      // Clear form
      setSelectedMedicines([])
      setCurrentMedicine({ medicine: '', quantity: 1 })
      setDoctor('')
      setCustomDoctorName('')
      setShowCustomDoctor(false)
      
      // Refresh medicine data
      await fetchMedicines()
      
      // Generate PDF
      await generatePDF(response.data.patient)
    } catch (error) {
      console.error('Bill submission error:', error)
      toast.error(error.response?.data?.error || 'Failed to generate bill')
    } finally {
      setLoading(false)
    }
  }

  // Generate and download PDF
  const generatePDF = async (billData) => {
    try {
      const response = await axios.post('/api/generate-pdf', billData, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `bill-${billData.patientId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to generate PDF')
    }
  }

  // Get patient history
  const getPatientHistory = async (patientId) => {
    try {
      setLoading(true)
      const response = await axios.put('/api/existingpatient', { patientId })
      return response.data
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch patient history')
      return null
    } finally {
      setLoading(false)
    }
  }

  // View patient history
  const handleViewHistory = async () => {
    if (selectedPatient) {
      router.push(`/dashboard/patient/history/${selectedPatient.patientId}`)
    }
  }

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  )

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleKeyDown = (e) => {
    if (!isDropdownOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredMedicines.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredMedicines[selectedIndex] && filteredMedicines[selectedIndex].quantity > 0) {
          setCurrentMedicine(prev => ({ 
            ...prev, 
            medicine: filteredMedicines[selectedIndex]._id 
          }))
          setIsDropdownOpen(false)
          setMedicineSearch('')
          setSelectedIndex(0)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsDropdownOpen(false)
        setMedicineSearch('')
        setSelectedIndex(0)
        break
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.medicine-dropdown')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen])

  const filteredMedicines = medicines.filter(medicine => 
    medicine.medicineName.toLowerCase().includes(medicineSearch.toLowerCase())
  )

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleDoctorChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setShowCustomDoctor(true);
      setDoctor('');
    } else {
      setShowCustomDoctor(false);
      setCustomDoctorName('');
      setDoctor(value);
    }
  };

  const handleCustomDoctorChange = (e) => {
    setCustomDoctorName(e.target.value);
    setDoctor(e.target.value);
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
            Existing Patient Billing
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

      <div className="space-y-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by Patient ID or Contact Number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Search
          </motion.button>
        </div>

        {errors.search && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-500"
          >
            {errors.search}
          </motion.p>
        )}

        <AnimatePresence mode="wait">
          {selectedPatient && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-50 p-4 rounded-lg space-y-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{selectedPatient.name}</h3>
                  <p className="text-sm text-gray-600">ID: {selectedPatient.id}</p>
                  <p className="text-sm text-gray-600">Contact: {selectedPatient.contact}</p>
                  <p className="text-sm text-gray-600">Age: {selectedPatient.age}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleViewHistory}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  View History
                </motion.button>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor
                </label>
                {!showCustomDoctor ? (
                  <select
                    name="doctor"
                    value={doctor}
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
                        setDoctor('');
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

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="bg-white p-4">
                      <h4 className="font-semibold mb-4">Previous Bills</h4>
                      {patientHistory.map((bill, index) => (
                        <div key={index} className="border-b last:border-b-0 py-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{bill.date}</span>
                            <span className="font-semibold">${bill.totalBill}</span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            {bill.medicines.map((med, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{med.name} x {med.quantity}</span>
                                <span>${med.total.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedPatient && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Add Medicines</h3>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative medicine-dropdown">
                <div
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen)
                    if (!isDropdownOpen) {
                      setSelectedIndex(0)
                    }
                  }}
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
                  <div 
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-[400px] overflow-y-auto"
                    onKeyDown={handleKeyDown}
                  >
                    <div className="sticky top-0 bg-white border-b border-gray-300">
                      <input
                        type="text"
                        placeholder="Search medicines..."
                        value={medicineSearch}
                        onChange={(e) => {
                          setMedicineSearch(e.target.value)
                          setSelectedIndex(0)
                        }}
                        className="w-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="py-1">
                      {loading ? (
                        <div className="px-4 py-2 text-gray-500">Loading medicines...</div>
                      ) : filteredMedicines.length === 0 ? (
                        <div className="px-4 py-2 text-gray-500">No medicines found</div>
                      ) : (
                        filteredMedicines.map((medicine, index) => (
                          <div
                            key={medicine._id}
                            onClick={() => {
                              if (medicine.quantity > 0) {
                                setCurrentMedicine(prev => ({ ...prev, medicine: medicine._id }))
                                setIsDropdownOpen(false)
                                setMedicineSearch('')
                                setSelectedIndex(0)
                              }
                            }}
                            className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                              medicine.quantity === 0 ? 'text-gray-400' : 'text-gray-700'
                            } ${
                              index === selectedIndex ? 'bg-indigo-50' : ''
                            }`}
                            style={{ pointerEvents: medicine.quantity === 0 ? 'none' : 'auto' }}
                          >
                            <div className="flex justify-between items-center">
                              <span>{medicine.medicineName}</span>
                              <span className="text-sm text-gray-500">
                                {formatCurrency(medicine.price)} ({medicine.quantity} in stock)
                              </span>
                            </div>
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
                          <td className="px-6 py-4">{item.medicineName}</td>
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

            {selectedMedicines.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="mt-6 w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        >
          Generate Bill
        </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

