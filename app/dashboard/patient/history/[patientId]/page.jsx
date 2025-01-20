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
        const response = await axios.get(`/api/patient/history/${params.patientId}`)
        setPatient(response.data.patient)
      } catch (error) {
        console.error('Error fetching patient history:', error)
        toast.error(error.response?.data?.error || 'Failed to fetch patient history')
        if (error.response?.status === 404) {
          router.push('/dashboard/patient')
        }
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
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700">Patient not found</h2>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Patients
          </button>
        </motion.div>

          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8"
        >
          <div className="grid md:grid-cols-2 gap-6">
              <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Patient Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Patient ID:</span> {patient.patientId}</p>
                <p><span className="font-medium">Name:</span> {patient.name}</p>
                <p><span className="font-medium">Age:</span> {patient.age}</p>
                <p><span className="font-medium">Contact:</span> {patient.contact}</p>
                  </div>
                  </div>
                  <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Billing Summary</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Total Bills:</span> {patient.bills.length}</p>
                <p><span className="font-medium">Total Amount:</span> ${patient.totalBills.toFixed(2)}</p>
                  </div>
              </div>
            </div>
          </motion.div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-800">Billing History</h3>
          <AnimatePresence>
            {patient.bills.map((bill, index) => (
        <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6"
              >
                <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm text-gray-500">{formatDate(bill.createdAt)}</p>
                    <p className="font-medium text-lg">Total: ${bill.totalAmount.toFixed(2)}</p>
                </div>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePrint(bill)}
                      className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <FiPrinter className="mr-2" />
                      Print
                    </motion.button>
                </div>
              </div>

                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-gray-200">
                    {bill.medicines.map((medicine, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4">{medicine.medicineName}</td>
                          <td className="px-6 py-4">{medicine.quantity}</td>
                          <td className="px-6 py-4">${medicine.price.toFixed(2)}</td>
                          <td className="px-6 py-4">${medicine.total.toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 