import { useState } from 'react'
import { motion } from 'framer-motion'

export default function SearchMedicine() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])

  const handleSearch = (e) => {
    e.preventDefault()
    // Here you would typically perform the search operation
    console.log('Searching for:', searchTerm)
    // For demonstration, we'll set some dummy results
    setSearchResults([
      { id: 1, name: 'Aspirin', price: 5.99 },
      { id: 2, name: 'Ibuprofen', price: 7.99 },
      { id: 3, name: 'Paracetamol', price: 4.99 },
    ])
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Search Medicine</h2>
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter medicine name"
            className="flex-grow rounded-l-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="flex-shrink-0 px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Search
          </motion.button>
        </div>
      </form>
      {searchResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Search Results:</h3>
          <ul className="space-y-2">
            {searchResults.map((medicine) => (
              <motion.li
                key={medicine.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-50 p-3 rounded-md"
              >
                <span className="font-medium">{medicine.name}</span> - ₹{medicine.price.toFixed(2)}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

