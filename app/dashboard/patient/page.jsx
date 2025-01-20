'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import NewPatient from './NewPatient'
import ExistingPatient from './ExistingPatient'
import SearchMedicine from './SearchMedicine'

export default function PatientModule() {
  const [activeTab, setActiveTab] = useState('new')

  const tabs = [
    { id: 'new', label: 'New Patient' },
    { id: 'existing', label: 'Existing Patient' },
    { id: 'search', label: 'Search Medicine' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Patient Module</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-4">
              <nav className="flex space-x-4">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-2 font-medium text-sm rounded-md ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </motion.button>
                ))}
              </nav>
            </div>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'new' && <NewPatient />}
              {activeTab === 'existing' && <ExistingPatient />}
              {activeTab === 'search' && <SearchMedicine />}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

