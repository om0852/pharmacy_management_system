"use client"
import Link from 'next/link'
import { motion } from 'framer-motion'

const modules = [
  { name: 'Patient', href: '/dashboard/patient', icon: '👤' },
  { name: 'Medicine', href: '/dashboard/medicine', icon: '💊' },
  { name: 'Update', href: '/dashboard/update', icon: '🔄' },
  { name: 'Alert', href: '/dashboard/alert', icon: '🚨' },
]

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Pharmacy Management Dashboard</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((module) => (
                <motion.div
                  key={module.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href={module.href} className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 text-4xl">{module.icon}</div>
                      <div className="ml-4">
                        <h2 className="text-xl font-semibold text-gray-900">{module.name}</h2>
                        <p className="mt-1 text-gray-600">Manage {module.name.toLowerCase()} information</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

