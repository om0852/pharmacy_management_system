"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiUsers, FiAlertCircle, FiCalendar, FiDollarSign, FiClock, FiPackage } from 'react-icons/fi'
import { Line } from 'react-chartjs-2'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import axios from 'axios'
import { toast } from 'react-hot-toast'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const modules = [
  { 
    name: 'Patient', 
    href: '/dashboard/patient', 
    icon: '👤',
    actions: [
      { name: 'New Patient', href: '/dashboard/patient/', description: 'Register a new patient' },
      { name: 'Existing Patient', href: '/dashboard/patient/', description: 'Manage existing patients' }
    ]
  },
  { 
    name: 'Medicine', 
    href: '/dashboard/medicine', 
    icon: '💊',
    actions: [
      { name: 'Add Medicine', href: '/dashboard/medicine', description: 'Add new medicines to inventory' },
      { name: 'View Stock', href: '/dashboard/medicine', description: 'Check current stock levels' }
    ]
  },
]

const getBubbleStyle = (index) => {
  // Use deterministic values based on index
  const positions = [
    { left: '10%', top: '20%' },
    { left: '20%', top: '80%' },
    { left: '30%', top: '40%' },
    { left: '40%', top: '60%' },
    { left: '50%', top: '30%' },
    { left: '60%', top: '70%' },
    { left: '70%', top: '25%' },
    { left: '80%', top: '65%' },
    { left: '90%', top: '35%' },
    { left: '15%', top: '55%' },
    { left: '25%', top: '15%' },
    { left: '35%', top: '85%' },
    { left: '45%', top: '45%' },
    { left: '55%', top: '75%' },
    { left: '85%', top: '90%' }
  ];

  const sizes = [40, 50, 60, 70, 80];
  const durations = [15, 18, 20, 22, 25];
  const delays = [0, 1, 2, 3, 4];

  // Define different color combinations for variety
  const colors = [
    { start: '86, 97, 179', end: '168, 85, 247' },    // Blue to Purple
    { start: '59, 130, 246', end: '147, 51, 234' },   // Bright Blue to Purple
    { start: '236, 72, 153', end: '159, 122, 234' },  // Pink to Purple
    { start: '88, 28, 135', end: '59, 130, 246' },    // Deep Purple to Blue
    { start: '219, 39, 119', end: '124, 58, 237' }    // Pink to Violet
  ];

  const position = positions[index % positions.length];
  const size = sizes[index % sizes.length];
  const duration = durations[index % durations.length];
  const delay = delays[index % delays.length];
  const color = colors[index % colors.length];
  const baseOpacity = ((index % 3) + 2) / 10; // Values between 0.2 and 0.4

  return {
    left: position.left,
    top: position.top,
    width: `${size}px`,
    height: `${size}px`,
    background: `linear-gradient(135deg, 
      rgba(${color.start}, ${baseOpacity}), 
      rgba(${color.end}, ${baseOpacity}))`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)'
  };
};

const DashboardBubbles = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="dashboard-bubbles fixed inset-0 pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.5, 
            delay: i * 0.1,
            ease: "easeOut"
          }}
          className="dashboard-bubble absolute rounded-full"
          style={getBubbleStyle(i)}
        />
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayIncome: 0,
    monthlyIncome: 0,
    lowStock: 0,
    expiringStock: 0,
    recentTransactions: []
  })
  const [dateRange, setDateRange] = useState([null, null])
  const [startDate, endDate] = dateRange
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        console.log('Fetching dashboard data...') // Debug log
        const response = await axios.get('/api/dashboard/stats')
        console.log('Dashboard data received:', response.data) // Debug log

        setStats({
          totalPatients: response.data.totalPatients || 0,
          todayIncome: response.data.todayIncome || 0,
          monthlyIncome: response.data.monthlyIncome || 0,
          lowStock: response.data.lowStock || 0,
          expiringStock: response.data.expiringStock || 0,
          recentTransactions: response.data.recentTransactions || []
        })

        // Prepare chart data
       
       
        const monthlyData = response.data.monthlyIncomeData || []
        setChartData({
          labels: monthlyData.map(item => item.month),
          datasets: [
            {
              label: 'Monthly Income',
              data: monthlyData.map(item => item.income),
              fill: false,
              borderColor: 'rgb(99, 102, 241)',
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
              tension: 0.4
            }
          ]
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast.error(error.response?.data?.error || 'Failed to fetch dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleDateRangeChange = async (update) => {
    setDateRange(update)
    if (update[0] && update[1]) {
      try {
        const response = await axios.get('/api/dashboard/income', {
          params: {
            startDate: update[0].toISOString(),
            endDate: update[1].toISOString()
          }
        })
        setStats(prev => ({
          ...prev,
          rangeIncome: response.data.income
        }))
      } catch (error) {
        console.error('Error fetching range income:', error)
        toast.error('Failed to fetch income for selected range')
      }
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Income Trend'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value)
          }
        }
      }
    }
  }

  const statCards = [
    { title: 'Total Patients', value: stats.totalPatients, icon: FiUsers, color: 'from-blue-500 to-blue-600' },
    { title: 'Low Stock Items', value: stats.lowStock, icon: FiAlertCircle, color: 'from-red-500 to-red-600' },
    { title: 'Expiring Next Month', value: stats.expiringStock, icon: FiPackage, color: 'from-yellow-500 to-yellow-600' },
    { title: 'Today\'s Income', value: formatCurrency(stats.todayIncome), icon: FiClock, color: 'from-purple-500 to-purple-600' },
    { title: 'Monthly Income', value: formatCurrency(stats.monthlyIncome), icon: FiCalendar, color: 'from-indigo-500 to-indigo-600' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 relative overflow-hidden">
      <DashboardBubbles />
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Medicare Dashboard Overview
          </h1>
        </motion.div>

        {/* Quick Access Modules */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {modules.map((module, moduleIndex) => (
            <motion.div
              key={module.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: moduleIndex * 0.1 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span>{module.icon}</span>
                    {module.name}
                  </h2>
                  <Link
                    href={module.href}
                    className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    View All
                  </Link>
                </div>
                <div className="space-y-4">
                  {module.actions.map((action, actionIndex) => (
                    <motion.div
                      key={action.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (moduleIndex * 0.1) + (actionIndex * 0.1) }}
                    >
                      <Link href={action.href}>
                        <div className="group p-4 border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200">
                          <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600">
                            {action.name}
                          </h3>
                          <p className="text-sm text-gray-500 group-hover:text-indigo-500">
                            {action.description}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className={`p-6 bg-gradient-to-r ${stat.color}`}>
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <p className="text-sm opacity-80">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-white opacity-80" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Low Stock Alert */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiAlertCircle className="text-red-500" />
              Low Stock Alert
            </h2>
            <div className="space-y-2">
              {stats.lowStock > 0 ? (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-red-700">{stats.lowStock} items need restock</span>
                  <Link
                    href="/dashboard/inventory/low-stock"
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              ) : (
                <div className="p-3 bg-green-50 rounded-lg text-green-700">
                  All items are well stocked
                </div>
              )}
            </div>
          </motion.div>

          {/* Expiring Stock Alert */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiPackage className="text-yellow-500" />
              Expiring Next Month
            </h2>
            <div className="space-y-2">
              {stats.expiringStock > 0 ? (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-700">{stats.expiringStock} items expiring within next month</span>
                  <Link
                    href="/dashboard/inventory/expiring"
                    className="text-sm text-yellow-600 hover:text-yellow-800 font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              ) : (
                <div className="p-3 bg-green-50 rounded-lg text-green-700">
                  No items expiring next month
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Date Range Picker and Custom Range Income */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">Custom Date Range Income</h2>
          <div className="flex items-center gap-4">
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateRangeChange}
              className="px-4 py-2 border rounded-lg"
              placeholderText="Select date range"
            />
            {dateRange[0] && dateRange[1] && (
              <div className="text-lg font-semibold text-green-600">
                Income: {formatCurrency(stats.rangeIncome || 0)}
              </div>
            )}
          </div>
        </motion.div>

        {/* Income Chart
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">Income Trends</h2>
          <div className="h-[400px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </motion.div> */}

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentTransactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction._id || `transaction-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">{formatDate(transaction.date)}</td>
                    <td className="px-6 py-4">{transaction.patientName}</td>
                    <td className="px-6 py-4">{formatCurrency(transaction.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'Paid' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status || 'Paid'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
      <style jsx global>{`
        @keyframes dashboardFloat {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(30px, -30px) rotate(120deg);
          }
          66% {
            transform: translate(-20px, 20px) rotate(240deg);
          }
          100% {
            transform: translate(0, 0) rotate(360deg);
          }
        }
        
        .dashboard-bubble {
          animation: dashboardFloat infinite ease-in-out;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
        }
        
        .dashboard-bubble:nth-child(even) {
          animation-direction: reverse;
        }
        
        .dashboard-bubbles {
          z-index: 1;
        }
      `}</style>
    </div>
  )
}

