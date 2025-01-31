'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function AlertModule() {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    // Here you would typically fetch alerts from your backend
    // For demonstration, we'll set some dummy alerts
    setAlerts([
      { id: 1, type: 'stock', medicine: 'Aspirin', message: 'Stock is below 10 units' },
      { id: 2, type: 'expiry', medicine: 'Ibuprofen', message: 'Expires in 30 days' },
      { id: 3, type: 'stock', medicine: 'Paracetamol', message: 'Out of stock' },
    ])
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Current Alerts</h2>
              {alerts.length > 0 ? (
                <ul className="space-y-4">
                  {alerts.map((alert) => (
                    <motion.li
                      key={alert.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 rounded-md ${
                        alert.type === 'stock' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}
                    >
                      <h3 className="font-semibold">{alert.medicine}</h3>
                      <p>{alert.message}</p>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p>No alerts at the moment.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

