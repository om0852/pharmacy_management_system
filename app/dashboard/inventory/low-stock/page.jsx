"use client"
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-hot-toast'

export default function LowStock() {
  const router = useRouter()
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLowStockMedicines()
  }, [])

  const fetchLowStockMedicines = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/medicine/low-stock')
      setMedicines(response.data)
      
      // Send email notification if there are low stock items
      if (response.data.length > 0) {
        const emailContent = `
          <h2>Low Stock Alert</h2>
          <p>The following items are running low on stock:</p>
          <ul>
            ${response.data.map(med => `
              <li>${med.medicineName} - Only ${med.quantity} units remaining</li>
            `).join('')}
          </ul>
        `;

        await axios.post('/api/notifications/email', {
          subject: 'Low Stock Alert - Medical Management System',
          content: emailContent
        });
      }
    } catch (error) {
      console.error('Error fetching low stock medicines:', error)
      toast.error('Failed to fetch low stock items')
    } finally {
      setLoading(false)
    }
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
            <FiAlertCircle className="text-red-500" />
            Low Stock Items
          </h1>
        </motion.div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
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
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {medicine.quantity} units
                      </span>
                    </td>
                    <td className="px-6 py-4">{medicine.category}</td>
                    <td className="px-6 py-4">{medicine.manufacturer}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/dashboard/medicine?edit=${medicine._id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Update Stock
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