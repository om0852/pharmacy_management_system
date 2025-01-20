"use client"
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiPackage } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-hot-toast'

export default function ExpiringStock() {
  const router = useRouter()
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExpiringMedicines()
  }, [])

  const fetchExpiringMedicines = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/medicine/expiring')
      setMedicines(response.data)
      
      // Send email notification if there are expiring items
      if (response.data.length > 0) {
        const emailContent = `
          <h2>Expiring Stock Alert</h2>
          <p>The following items are expiring within the next month:</p>
          <ul>
            ${response.data.map(med => `
              <li>${med.medicineName} - Expires on ${new Date(med.expiryDate).toLocaleDateString()}</li>
            `).join('')}
          </ul>
        `;

        await axios.post('/api/notifications/email', {
          subject: 'Expiring Stock Alert - Medical Management System',
          content: emailContent
        });
      }
    } catch (error) {
      console.error('Error fetching expiring medicines:', error)
      toast.error('Failed to fetch expiring items')
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry - today
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FiPackage className="text-yellow-500" />
            Expiring Stock
          </h1>
        </motion.div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {medicines.map((medicine) => (
                  <motion.tr
                    key={medicine._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">{medicine.medicineName}</td>
                    <td className="px-6 py-4">
                      {new Date(medicine.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {getDaysUntilExpiry(medicine.expiryDate)} days
                      </span>
                    </td>
                    <td className="px-6 py-4">{medicine.quantity} units</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/dashboard/medicine?edit=${medicine._id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Manage Stock
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 