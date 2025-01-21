"use client"
import React, { useState, useEffect, use, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FiPrinter, FiDownload, FiArrowLeft } from 'react-icons/fi'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import axios from 'axios'
import { toast } from 'react-hot-toast'

// Create a separate component for the printable bill

const PrintableBill = ({ bill, patient }) => {
  if (!bill || !patient) return null;

  return (
    <div className="print-content p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Medical Bill</h1>
        <p className="text-gray-600">Bill #{bill.id}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h2 className="font-bold mb-2">Patient Details</h2>
          <p>Name: {patient.name}</p>
          <p>ID: {patient.id}</p>
          <p>Contact: {patient.contact}</p>
          <p>Age: {patient.age} years</p>
        </div>
        <div className="text-right">
          <p>Date: {bill.date}</p>
          <p>Status: {bill.status}</p>
        </div>
      </div>
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Medicine</th>
            <th className="text-left py-2">Quantity</th>
            <th className="text-left py-2">Price</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {bill.medicines.map((medicine, idx) => (
            <tr key={idx} className="border-b">
              <td className="py-2">{medicine.name}</td>
              <td className="py-2">{medicine.quantity}</td>
              <td className="py-2">${medicine.price.toFixed(2)}</td>
              <td className="py-2 text-right">${medicine.total.toFixed(2)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td colSpan="3" className="py-2 text-right">Total Amount:</td>
            <td className="py-2 text-right">${bill.totalBill.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Thank you for your business!</p>
        <p>For any queries, please contact us at: pharmacy@example.com</p>
      </div>
    </div>
  );
};

export default function PatientHistory() {
  const params = useParams()
  const router = useRouter()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState(null)

  useEffect(() => {
    const fetchPatientHistory = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/existingpatient?search=${params.patientId}`)
        setPatient(response.data)
      } catch (error) {
        console.error('Error fetching patient history:', error)
        toast.error('Failed to fetch patient history')
      } finally {
        setLoading(false)
      }
    }

    if (params.patientId) {
      fetchPatientHistory()
    }
  }, [params.patientId, router])

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handlePrint = async (bill) => {
    setSelectedBill(bill)
    const printWindow = window.open('', '', 'width=800,height=600')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .patient-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .total { text-align: right; font-weight: bold; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Medical Bill Receipt</h2>
            <p>Bill Date: ${formatDate(bill.createdAt)}</p>
          </div>
          <div class="patient-info">
            <h3>Patient Information</h3>
            <p>Patient ID: ${patient.patientId}</p>
            <p>Name: ${patient.name}</p>
            <p>Age: ${patient.age}</p>
            <p>Contact: ${patient.contact}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.medicines.map(med => `
                <tr>
                  <td>${med.medicineName}</td>
                  <td>${med.quantity}</td>
                  <td>$${med.price.toFixed(2)}</td>
                  <td>$${med.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <p>Total Amount: $${bill.totalAmount.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Patient not found</h1>
          </div>
        </div>
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
            Back to Patient
          </button>
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Patient History</h1>
            <div className="mt-4">
              <p className="text-gray-600">Name: {patient.name}</p>
              <p className="text-gray-600">Patient ID: {patient.patientId}</p>
              <p className="text-gray-600">Contact: {patient.contact}</p>
              <p className="text-gray-600">Age: {patient.age}</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          {patient.bills.map((bill, index) => (
            <motion.div
              key={bill._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Bill #{patient.bills.length - index}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(bill.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePrint(bill)}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FiPrinter className="mr-2" />
                      Print
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDownload(bill)}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FiDownload className="mr-2" />
                      Download
                    </motion.button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bill.medicines.map((medicine, medIndex) => (
                        <tr key={medIndex} className="hover:bg-gray-50">
                          <td className="px-6 py-4">{medicine.medicineName}</td>
                          <td className="px-6 py-4">{medicine.quantity}</td>
                          <td className="px-6 py-4">{formatCurrency(medicine.price)}</td>
                          <td className="px-6 py-4">{formatCurrency(medicine.total)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td colSpan="3" className="px-6 py-4 text-right font-bold">Total Amount:</td>
                        <td className="px-6 py-4 font-bold">{formatCurrency(bill.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full ${
                    bill.status === 'Paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {bill.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
} 