import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiClock, 
  FiShoppingBag, FiSearch, FiFilter, FiArrowRight, FiChevronDown,
  FiCalendar, FiDollarSign, FiMapPin, FiCreditCard, FiPlus
} from 'react-icons/fi';
import { FaBoxOpen, FaShippingFast, FaMoneyBillWave } from 'react-icons/fa';
import { RiRefund2Line } from 'react-icons/ri';
import { IoStatsChart } from 'react-icons/io5';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';


const OrdersPage = () => {
  const { user, getOrders } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 100], [1, 0.9]);
  const scale = useTransform(scrollY, [0, 100], [1, 0.98]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const result = await getOrders();
        if (result.success) {
          setOrders(result.orders);
        } else {
          setError(result.message);
          if (result.redirectToLogin) {
            navigate('/login');
          }
        }
      } catch (err) {
        setError('Failed to fetch orders. Please try again later.');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate, getOrders]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered': return <FiCheckCircle className="text-emerald-500" size={18} />;
      case 'Cancelled': return <FiXCircle className="text-rose-500" size={18} />;
      case 'Pending': return <FiClock className="text-amber-500" size={18} />;
      case 'Shipped':
      case 'Out for Delivery': return <FiTruck className="text-blue-500" size={18} />;
      default: return <FiPackage className="text-gray-500" size={18} />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.address_line.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.order_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    hover: {
      scale: 1.02,
      boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.08)",
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    tap: {
      scale: 0.98
    }
  };

  const statusFilters = [
    { value: 'all', label: 'All Orders', icon: <FaBoxOpen />, count: orders.length },
    { value: 'Pending', label: 'Pending', icon: <FiClock />, count: orders.filter(o => o.order_status === 'Pending').length },
    { value: 'Shipped', label: 'Shipped', icon: <FaShippingFast />, count: orders.filter(o => o.order_status === 'Shipped').length },
    { value: 'Delivered', label: 'Delivered', icon: <FiCheckCircle />, count: orders.filter(o => o.order_status === 'Delivered').length },
    { value: 'Cancelled', label: 'Cancelled', icon: <FiXCircle />, count: orders.filter(o => o.order_status === 'Cancelled').length }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return 'bg-emerald-500/10 text-emerald-600';
      case 'Cancelled': return 'bg-rose-500/10 text-rose-600';
      case 'Pending': return 'bg-amber-500/10 text-amber-600';
      case 'Shipped': return 'bg-blue-500/10 text-blue-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (error) return (
    <EmptyState 
      icon={<FiXCircle size={48} className="text-red-500" />}
      title="Oops! Something went wrong"
      description={error}
      actions={[
        { label: 'Return to Home', to: '/' },
        { label: 'Try Again', onClick: () => window.location.reload() }
      ]}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Sticky Header with Stats */}
      <motion.header 
        style={{ opacity, scale }}
        className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mb-4 md:mb-0"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Order History
              </h1>
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-indigo-50 text-indigo-600 mr-3">
                    <FaBoxOpen size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Orders</p>
                    <p className="font-semibold">{orders.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-emerald-50 text-emerald-600 mr-3">
                    <FiCheckCircle size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Delivered</p>
                    <p className="font-semibold">{orders.filter(o => o.order_status === 'Delivered').length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-blue-50 text-blue-600 mr-3">
                    <FaShippingFast size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">In Transit</p>
                    <p className="font-semibold">{orders.filter(o => o.order_status === 'Shipped').length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-amber-50 text-amber-600 mr-3">
                    <FiClock size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pending</p>
                    <p className="font-semibold">{orders.filter(o => o.order_status === 'Pending').length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search orders by ID, address, or product..."
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
            </div>
            
            <div className="mt-4 flex overflow-x-auto pb-2 scrollbar-hide space-x-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`flex items-center px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    filterStatus === filter.value 
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{filter.icon}</span>
                  {filter.label}
                  {filter.count > 0 && (
                    <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <EmptyState 
            icon={<FaBoxOpen size={48} className="text-gray-400" />}
            title="No orders found"
            description={
              searchTerm || filterStatus !== 'all' 
                ? "Try adjusting your search or filter criteria"
                : "You haven't placed any orders yet"
            }
            actions={[
              { 
                label: 'Continue Shopping', 
                to: '/',
                className: 'bg-indigo-600 text-white hover:bg-indigo-700'
              }
            ]}
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4"
          >
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.div
                  key={order.order_id}
                  variants={itemVariants}
                  whileHover="hover"
                  whileTap="tap"
                  layout
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="mb-4 sm:mb-0">
                        <div className="flex items-center">
                          {getStatusIcon(order.order_status)}
                          <h3 className="ml-2 font-bold text-gray-900">
                            Order #{order.order_id.substring(0, 8).toUpperCase()}
                          </h3>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center text-sm text-gray-500 space-x-3">
                          <span className="flex items-center">
                            <FiCalendar className="mr-1" size={14} />
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="flex items-center">
                            ₹{(Number(order.total_amount) || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                          {order.order_status}
                        </span>
                        <button 
                          onClick={() => toggleOrderExpand(order.order_id)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <FiChevronDown className={`transition-transform ${expandedOrder === order.order_id ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    <AnimatePresence>
                      {expandedOrder === order.order_id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 overflow-hidden"
                        >
                          <div className="border-t border-gray-100 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Order Summary */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                  <IoStatsChart className="mr-2 text-indigo-600" />
                                  Order Summary
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-medium">₹{(Number(order.total_amount) || 0).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Shipping</span>
                                    <span className="font-medium">₹0.00</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Tax</span>
                                    <span className="font-medium">₹0.00</span>
                                  </div>
                                  <div className="border-t border-gray-200 my-2"></div>
                                  <div className="flex justify-between text-sm font-medium">
                                    <span>Total</span>
                                    <span>₹{(Number(order.total_amount) || 0).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Shipping Info */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                  <FiMapPin className="mr-2 text-indigo-600" />
                                  Shipping Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <p className="font-medium">{order.address_line}</p>
                                  <p>{order.city}, {order.state}</p>
                                 
                                  
                                </div>
                              </div>
                              
                              {/* Payment Info */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                  <FiCreditCard className="mr-2 text-indigo-600" />
                                  Payment Method
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex items-center">
                                    <div className="bg-white p-2 rounded-md shadow-xs border border-gray-200 mr-3">
                                      {order.payment_method === 'Credit Card' ? (
                                        <div className="w-8 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-sm"></div>
                                      ) : (
                                        <FaMoneyBillWave className="text-green-500" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium capitalize">{order.payment_method.toLowerCase()}</p>
                                      
                                    </div>
                                  </div>
                                  
                                </div>
                              </div>
                            </div>
                            
                            {/* Products List */}
                            <div className="mt-6">
                              <h4 className="font-medium text-gray-900 mb-4">Products</h4>
                              <div className="space-y-4">
                                {order.items?.map((item, index) => (
                                  <div key={index} className="flex items-start border-b border-gray-100 pb-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                      {item.images?.[0] ? (
                                        <img 
                                          src={item.images[0]} 
                                          alt={item.productName} 
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                          <FiPackage size={20} />
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-4 flex-1">
                                      <h5 className="font-medium text-gray-900">{item.productName}</h5>
                                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                      <p className="text-sm font-medium mt-1">₹{item.price}</p>
                                    </div>
                                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                      Buy Again
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="mt-6 flex flex-wrap gap-3">
                              <Link
                                to={`/orders/${order.order_id}`}
                                className="inline-flex items-center justify-center px-4 py-2 border bg-indigo-600 text-white shadow-md border-gray-300 rounded-lg font-medium transition-colors"
                              >
                                View Order Details
                              </Link>
                              <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors">
                                Contact Support
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default OrdersPage;



























































// import React, { useState, useEffect, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { AuthContext } from '../context/AuthContext';
// import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
// import { 
//   FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiClock, 
//   FiShoppingBag, FiSearch, FiFilter, FiArrowRight, FiChevronDown,
//   FiPlus, FiMinus, FiRefreshCw
// } from 'react-icons/fi';
// import { 
//   FaBoxOpen, FaShippingFast, FaMoneyBillWave, FaRegCreditCard,
//   FaMapMarkerAlt, FaCalendarAlt, FaReceipt
// } from 'react-icons/fa';
// import { RiRefund2Line } from 'react-icons/ri';
// import LoadingSpinner from '../components/LoadingSpinner';
// import EmptyState from '../components/EmptyState';
// // import OrderStatusBadge from '../components/OrderStatusBadge';

// const OrdersPage = () => {
//   const { user, getOrders } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [expandedOrder, setExpandedOrder] = useState(null);
//   const { scrollY } = useScroll();
//   const opacity = useTransform(scrollY, [0, 100], [1, 0.9]);
//   const scale = useTransform(scrollY, [0, 100], [1, 0.98]);

//   useEffect(() => {
//     if (!user) {
//       navigate('/login');
//       return;
//     }

//     const fetchOrders = async () => {
//       try {
//         setLoading(true);
//         const result = await getOrders();
//         if (result.success) {
//           setOrders(result.orders);
//         } else {
//           setError(result.message);
//           if (result.redirectToLogin) {
//             navigate('/login');
//           }
//         }
//       } catch (err) {
//         setError('Failed to fetch orders. Please try again later.');
//         console.error('Error fetching orders:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrders();
//   }, [user, navigate, getOrders]);

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'Delivered': return <FiCheckCircle className="text-emerald-500" size={18} />;
//       case 'Cancelled': return <FiXCircle className="text-rose-500" size={18} />;
//       case 'Pending': return <FiClock className="text-amber-500" size={18} />;
//       case 'Shipped':
//       case 'Out for Delivery': return <FiTruck className="text-blue-500" size={18} />;
//       default: return <FiPackage className="text-gray-500" size={18} />;
//     }
//   };

//   const filteredOrders = orders.filter(order => {
//     const matchesSearch = order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
//                          order.address_line.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filterStatus === 'all' || order.order_status === filterStatus;
//     return matchesSearch && matchesFilter;
//   });

//   const toggleOrderExpansion = (orderId) => {
//     setExpandedOrder(expandedOrder === orderId ? null : orderId);
//   };

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1,
//         when: "beforeChildren"
//       }
//     }
//   };

//   const itemVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: {
//         duration: 0.4,
//         ease: [0.25, 0.1, 0.25, 1]
//       }
//     },
//     hover: {
//       scale: 1.02,
//       boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.08)",
//       transition: {
//         duration: 0.3,
//         ease: "easeOut"
//       }
//     },
//     tap: {
//       scale: 0.98
//     }
//   };

//   const statusFilters = [
//     { value: 'all', label: 'All Orders', icon: <FaBoxOpen />, color: 'bg-gray-100 text-gray-800' },
//     { value: 'Pending', label: 'Pending', icon: <FiClock />, color: 'bg-amber-100 text-amber-800' },
//     { value: 'Shipped', label: 'Shipped', icon: <FaShippingFast />, color: 'bg-blue-100 text-blue-800' },
//     { value: 'Delivered', label: 'Delivered', icon: <FiCheckCircle />, color: 'bg-emerald-100 text-emerald-800' },
//     { value: 'Cancelled', label: 'Cancelled', icon: <FiXCircle />, color: 'bg-rose-100 text-rose-800' }
//   ];

//   if (loading) return <LoadingSpinner fullScreen message="Loading your orders..." />;

//   if (error) return (
//     <EmptyState 
//       icon={<FiXCircle size={48} className="text-red-500" />}
//       title="Oops! Something went wrong"
//       description={error}
//       actions={[
//         { label: 'Return to Home', to: '/' },
//         { label: 'Try Again', onClick: () => window.location.reload() }
//       ]}
//     />
//   );

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
//     >
//       <motion.header 
//         style={{ opacity, scale }}
//         className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200 py-3 px-6 shadow-sm"
//       >
//         <div className="max-w-7xl mx-auto flex items-center justify-between">
//           <motion.div
//             initial={{ y: -20, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ duration: 0.4, delay: 0.2 }}
//             className="flex items-center"
//           >
//             <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//               Order History
//             </h1>
//             <span className="ml-3 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium">
//               {orders.length} orders
//             </span>
//           </motion.div>
//           <button 
//             onClick={() => window.location.reload()}
//             className="p-2 rounded-full hover:bg-gray-100 transition-colors"
//             aria-label="Refresh orders"
//           >
//             <FiRefreshCw className="text-gray-600" />
//           </button>
//         </div>
//       </motion.header>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Search and Filter */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3 }}
//           className="mb-8"
//         >
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Search Card */}
//             <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
//               <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
//                 <FiSearch className="mr-2" /> Search Orders
//               </h3>
//               <div className="relative">
//                 <input
//                   type="text"
//                   placeholder="Order ID, address, product..."
//                   className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <FiSearch className="text-gray-400" />
//                 </div>
//               </div>
//             </div>

//             {/* Filter Card */}
//             <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
//               <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
//                 <FiFilter className="mr-2" /> Filter by Status
//               </h3>
//               <div className="flex flex-wrap gap-2">
//                 {statusFilters.map((filter) => (
//                   <button
//                     key={filter.value}
//                     onClick={() => setFilterStatus(filter.value)}
//                     className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${
//                       filterStatus === filter.value 
//                         ? 'bg-indigo-600 text-white shadow-md'
//                         : `${filter.color} hover:opacity-90`
//                     }`}
//                   >
//                     <span className="mr-1.5">{filter.icon}</span>
//                     {filter.label}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Stats Card */}
//             <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
//               <h3 className="text-sm font-medium text-gray-500 mb-2">Order Summary</h3>
//               <div className="grid grid-cols-3 gap-2">
//                 <div className="text-center p-2 bg-blue-50 rounded-lg">
//                   <p className="text-xs text-blue-600">Pending</p>
//                   <p className="font-bold text-blue-800">
//                     {orders.filter(o => o.order_status === 'Pending').length}
//                   </p>
//                 </div>
//                 <div className="text-center p-2 bg-purple-50 rounded-lg">
//                   <p className="text-xs text-purple-600">Shipped</p>
//                   <p className="font-bold text-purple-800">
//                     {orders.filter(o => o.order_status === 'Shipped').length}
//                   </p>
//                 </div>
//                 <div className="text-center p-2 bg-green-50 rounded-lg">
//                   <p className="text-xs text-green-600">Delivered</p>
//                   <p className="font-bold text-green-800">
//                     {orders.filter(o => o.order_status === 'Delivered').length}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </motion.div>

//         {/* Orders List */}
//         {filteredOrders.length === 0 ? (
//           <EmptyState 
//             icon={<FaBoxOpen size={48} className="text-gray-400" />}
//             title="No orders found"
//             description={
//               searchTerm || filterStatus !== 'all' 
//                 ? "Try adjusting your search or filter criteria"
//                 : "You haven't placed any orders yet"
//             }
//             actions={[
//               { label: 'Continue Shopping', to: '/', icon: <FiShoppingBag className="mr-2" /> }
//             ]}
//           />
//         ) : (
//           <motion.div
//             variants={containerVariants}
//             initial="hidden"
//             animate="visible"
//             className="space-y-4"
//           >
//             <AnimatePresence>
//               {filteredOrders.map((order) => (
//                 <motion.div
//                   key={order.order_id}
//                   variants={itemVariants}
//                   whileHover="hover"
//                   whileTap="tap"
//                   layout
//                   className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200"
//                 >
//                   <div 
//                     className="p-5 sm:p-6 cursor-pointer"
//                     onClick={() => toggleOrderExpansion(order.order_id)}
//                   >
//                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//                       <div className="mb-4 sm:mb-0">
//                         <div className="flex items-center">
//                           {getStatusIcon(order.order_status)}
//                           <h3 className="ml-2 font-bold text-gray-900">
//                             Order #{order.order_id.substring(0, 8).toUpperCase()}
//                           </h3>
//                           <span className="ml-2 text-xs text-gray-500">
//                             {new Date(order.created_at).toLocaleDateString('en-US', {
//                               year: 'numeric',
//                               month: 'short',
//                               day: 'numeric'
//                             })}
//                           </span>
//                         </div>
//                         <div className="mt-2 flex flex-wrap items-center text-sm text-gray-500 space-x-3">
//                           <span className="flex items-center">
//                             <FaReceipt className="mr-1.5" size={12} />
//                             {order.items?.length || 0} items
//                           </span>
//                           <span className="flex items-center">
//                             <FaMoneyBillWave className="mr-1.5" size={12} />
//                             ₹{(Number(order.total_amount) || 0).toFixed(2)}
//                           </span>
//                           {/* <OrderStatusBadge status={order.order_status} /> */}
//                         </div>
//                       </div>
//                       <div className="flex items-center space-x-4">
//                         <button 
//                           className={`p-1 rounded-full transition-all ${expandedOrder === order.order_id ? 'bg-gray-100 rotate-180' : 'hover:bg-gray-100'}`}
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             toggleOrderExpansion(order.order_id);
//                           }}
//                         >
//                           <FiChevronDown className="text-gray-600" />
//                         </button>
//                       </div>
//                     </div>

//                     {/* Collapsed Preview */}
//                     {expandedOrder !== order.order_id && (
//                       <div className="mt-4">
//                         <div className="flex overflow-x-auto pb-2 space-x-3 scrollbar-hide">
//                           {order.items?.slice(0, 5).map((item, index) => (
//                             <div key={index} className="flex-shrink-0 relative group">
//                               <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
//                                 {item.images?.[0] ? (
//                                   <img 
//                                     src={item.images[0]} 
//                                     alt={item.productName} 
//                                     className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
//                                     loading="lazy"
//                                   />
//                                 ) : (
//                                   <div className="w-full h-full flex items-center justify-center text-gray-400">
//                                     <FiPackage size={20} />
//                                   </div>
//                                 )}
//                               </div>
//                               {index === 4 && order.items.length > 5 && (
//                                 <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs font-bold rounded-md">
//                                   +{order.items.length - 5}
//                                 </div>
//                               )}
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   {/* Expanded Details */}
//                   <AnimatePresence>
//                     {expandedOrder === order.order_id && (
//                       <motion.div
//                         initial={{ opacity: 0, height: 0 }}
//                         animate={{ opacity: 1, height: 'auto' }}
//                         exit={{ opacity: 0, height: 0 }}
//                         transition={{ duration: 0.3, ease: 'easeInOut' }}
//                         className="overflow-hidden"
//                       >
//                         <div className="px-6 pb-6 border-t border-gray-100">
//                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
//                             {/* Order Items */}
//                             <div>
//                               <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
//                                 <FiShoppingBag className="mr-2" /> Order Items
//                               </h4>
//                               <div className="space-y-3">
//                                 {order.items?.map((item, index) => (
//                                   <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
//                                     <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden mr-3">
//                                       {item.images?.[0] ? (
//                                         <img 
//                                           src={item.images[0]} 
//                                           alt={item.productName} 
//                                           className="w-full h-full object-cover"
//                                           loading="lazy"
//                                         />
//                                       ) : (
//                                         <div className="w-full h-full flex items-center justify-center text-gray-400">
//                                           <FiPackage size={20} />
//                                         </div>
//                                       )}
//                                     </div>
//                                     <div className="flex-1 min-w-0">
//                                       <h5 className="text-sm font-medium text-gray-900 truncate">
//                                         {item.productName || 'Unknown Product'}
//                                       </h5>
//                                       <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
//                                       <p className="text-sm font-medium text-gray-900 mt-1">
//                                         ₹{(Number(item.price) || 0).toFixed(2)}
//                                       </p>
//                                     </div>
//                                     <button className="ml-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
//                                       Buy again
//                                     </button>
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>

//                             {/* Order Summary */}
//                             <div>
//                               <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
//                                 <FaReceipt className="mr-2" /> Order Summary
//                               </h4>
//                               <div className="bg-gray-50 rounded-lg p-4">
//                                 <div className="space-y-3">
//                                   <div className="flex justify-between">
//                                     <span className="text-sm text-gray-600">Subtotal</span>
//                                     <span className="text-sm font-medium">₹{(Number(order.subtotal) || 0).toFixed(2)}</span>
//                                   </div>
//                                   <div className="flex justify-between">
//                                     <span className="text-sm text-gray-600">Shipping</span>
//                                     <span className="text-sm font-medium">₹{(Number(order.shipping_cost) || 0).toFixed(2)}</span>
//                                   </div>
//                                   <div className="flex justify-between">
//                                     <span className="text-sm text-gray-600">Tax</span>
//                                     <span className="text-sm font-medium">₹{(Number(order.tax) || 0).toFixed(2)}</span>
//                                   </div>
//                                   <div className="border-t border-gray-200 pt-2 flex justify-between">
//                                     <span className="text-base font-medium text-gray-900">Total</span>
//                                     <span className="text-base font-bold text-gray-900">₹{(Number(order.total_amount) || 0).toFixed(2)}</span>
//                                   </div>
//                                 </div>

//                                 <div className="mt-4 pt-4 border-t border-gray-200">
//                                   <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
//                                     <FaRegCreditCard className="mr-2" /> Payment Method
//                                   </h4>
//                                   <div className="flex items-center justify-between">
//                                     <span className="text-sm font-medium capitalize">
//                                       {order.payment_method.toLowerCase()}
//                                     </span>
//                                     <span className={`text-xs px-2 py-1 rounded ${
//                                       order.payment_status === 'Paid' 
//                                         ? 'bg-green-100 text-green-800' 
//                                         : 'bg-yellow-100 text-yellow-800'
//                                     }`}>
//                                       {order.payment_status}
//                                     </span>
//                                   </div>
//                                 </div>

//                                 <div className="mt-4 pt-4 border-t border-gray-200">
//                                   <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
//                                     <FaMapMarkerAlt className="mr-2" /> Shipping Address
//                                   </h4>
//                                   <address className="text-sm not-italic">
//                                     <div>{order.address_line}</div>
//                                     <div>{order.city}, {order.state}</div>
//                                     <div>{order.postal_code}, {order.country}</div>
//                                   </address>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>

//                           <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
//                             <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
//                               Download Invoice
//                             </button>
//                             <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
//                               Need Help?
//                             </button>
//                             {order.order_status === 'Delivered' && (
//                               <button className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors flex items-center">
//                                 <RiRefund2Line className="mr-2" /> Request Return
//                               </button>
//                             )}
//                             <Link
//                               to={`/orders/${order.order_id}`}
//                               className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors flex items-center"
//                             >
//                               View Full Details
//                             </Link>
//                           </div>
//                         </div>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </motion.div>
//               ))}
//             </AnimatePresence>
//           </motion.div>
//         )}
//       </div>
//     </motion.div>
//   );
// };

// export default OrdersPage;

















































// import React, { useState, useEffect, useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { AuthContext } from '../context/AuthContext';
// import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
// import { 
//   FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiClock, 
//   FiShoppingBag, FiSearch, FiFilter, FiArrowRight 
// } from 'react-icons/fi';
// import { FaBoxOpen, FaShippingFast, FaMoneyBillWave } from 'react-icons/fa';
// import LoadingSpinner from '../components/LoadingSpinner';
// import EmptyState from '../components/EmptyState';

// const OrdersPage = () => {
//   const { user, getOrders } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const { scrollY } = useScroll();
//   const opacity = useTransform(scrollY, [0, 100], [1, 0.9]);
//   const scale = useTransform(scrollY, [0, 100], [1, 0.98]);

//   useEffect(() => {
//     if (!user) {
//       navigate('/login');
//       return;
//     }

//     const fetchOrders = async () => {
//       try {
//         setLoading(true);
//         const result = await getOrders();
//         if (result.success) {
//           setOrders(result.orders);
//         } else {
//           setError(result.message);
//           if (result.redirectToLogin) {
//             navigate('/login');
//           }
//         }
//       } catch (err) {
//         setError('Failed to fetch orders. Please try again later.');
//         console.error('Error fetching orders:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrders();
//   }, [user, navigate, getOrders]);

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'Delivered': return <FiCheckCircle className="text-emerald-500" size={18} />;
//       case 'Cancelled': return <FiXCircle className="text-rose-500" size={18} />;
//       case 'Pending': return <FiClock className="text-amber-500" size={18} />;
//       case 'Shipped':
//       case 'Out for Delivery': return <FiTruck className="text-blue-500" size={18} />;
//       default: return <FiPackage className="text-gray-500" size={18} />;
//     }
//   };

//   const filteredOrders = orders.filter(order => {
//     const matchesSearch = order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
//                          order.address_line.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filterStatus === 'all' || order.order_status === filterStatus;
//     return matchesSearch && matchesFilter;
//   });

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1,
//         when: "beforeChildren"
//       }
//     }
//   };

//   const itemVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: {
//         duration: 0.4,
//         ease: [0.25, 0.1, 0.25, 1]
//       }
//     },
//     hover: {
//       scale: 1.02,
//       boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.08)",
//       transition: {
//         duration: 0.3,
//         ease: "easeOut"
//       }
//     },
//     tap: {
//       scale: 0.98
//     }
//   };

//   const statusFilters = [
//     { value: 'all', label: 'All Orders', icon: <FaBoxOpen /> },
//     { value: 'Pending', label: 'Pending', icon: <FiClock /> },
//     { value: 'Shipped', label: 'Shipped', icon: <FaShippingFast /> },
//     { value: 'Delivered', label: 'Delivered', icon: <FiCheckCircle /> },
//     { value: 'Cancelled', label: 'Cancelled', icon: <FiXCircle /> }
//   ];

//   if (loading) return <LoadingSpinner fullScreen />;

//   if (error) return (
//     <EmptyState 
//       icon={<FiXCircle size={48} className="text-red-500" />}
//       title="Oops! Something went wrong"
//       description={error}
//       actions={[
//         { label: 'Return to Home', to: '/' },
//         { label: 'Try Again', onClick: () => window.location.reload() }
//       ]}
//     />
//   );

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
//     >
//       <motion.header 
//         style={{ opacity, scale }}
//         className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 py-3 px-6 shadow-sm"
//       >
//         <div className="max-w-7xl mx-auto">
//           <motion.div
//             initial={{ y: -20, opacity: 0 }}
//             animate={{ y: 0, opacity: 1 }}
//             transition={{ duration: 0.4, delay: 0.2 }}
//           >
//             <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//               Your Orders
//             </h1>
//           </motion.div>
//         </div>
//       </motion.header>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Search and Filter */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3 }}
//           className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
//         >
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <FiSearch className="text-gray-400" />
//             </div>
//             <input
//               id="searchInput"
//               type="text"
//               placeholder="Search by order ID or address..."
//               className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>
//           <div className="flex overflow-x-auto pb-2 scrollbar-hide space-x-2">
//             {statusFilters.map((filter) => (
//               <button
//                 key={filter.value}
//                 onClick={() => setFilterStatus(filter.value)}
//                 className={`flex items-center px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
//                   filterStatus === filter.value 
//                     ? 'bg-indigo-600 text-white shadow-md'
//                     : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
//                 }`}
//               >
//                 <span className="mr-2">{filter.icon}</span>
//                 {filter.label}
//               </button>
//             ))}
//           </div>
//         </motion.div>

//         {/* Orders List */}
//         {filteredOrders.length === 0 ? (
//           <EmptyState 
//             icon={<FaBoxOpen size={48} className="text-gray-400" />}
//             title="No orders found"
//             description={
//               searchTerm || filterStatus !== 'all' 
//                 ? "Try adjusting your search or filter criteria"
//                 : "You haven't placed any orders yet"
//             }
//             actions={[
//               { label: 'Continue Shopping', to: '/' }
//             ]}
//           />
//         ) : (
//           <motion.div
//             variants={containerVariants}
//             initial="hidden"
//             animate="visible"
//             className="grid grid-cols-1 gap-6"
//           >
//             <AnimatePresence>
//               {filteredOrders.map((order) => (
//                 <motion.div
//                   key={order.order_id}
//                   variants={itemVariants}
//                   whileHover="hover"
//                   whileTap="tap"
//                   layout
//                   className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200"
//                 >
//                   <div className="p-5 sm:p-6">
//                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//                       <div className="mb-4 sm:mb-0">
//                         <div className="flex items-center">
//                           {getStatusIcon(order.order_status)}
//                           <h3 className="ml-2 font-bold text-gray-900">
//                             Order #{order.order_id.substring(0, 16).toUpperCase()}
//                           </h3>
//                         </div>
//                         <div className="mt-1 flex flex-wrap items-center text-sm text-gray-500 space-x-2">
//                           <span>
//                             {new Date(order.created_at).toLocaleDateString('en-US', {
//                               year: 'numeric',
//                               month: 'short',
//                               day: 'numeric'
//                             })}
//                           </span>
//                           <span>•</span>
//                           <span>{order.items?.length || 0} items</span>
//                         </div>
//                       </div>
//                       <div className="flex items-center space-x-3">
//                         <span className={`px-3 py-1 rounded-full text-sm font-medium ${
//                           order.order_status === 'Delivered' ? 'bg-green-100 text-green-800' :
//                           order.order_status === 'Cancelled' ? 'bg-red-100 text-red-800' :
//                           order.order_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
//                           'bg-blue-100 text-blue-800'
//                         }`}>
//                           {order.order_status}
//                         </span>
//                         <span className="font-bold text-gray-900">
//                           ₹{(Number(order.total_amount) || 0).toFixed(2)}
//                         </span>
//                       </div>
//                     </div>

//                     {/* Product Preview */}
//                     <div className="mt-4">
//                       <div className="flex overflow-x-auto pb-2 space-x-3 scrollbar-hide">
//                         {order.items?.slice(0, 5).map((item, index) => (
//                           <div key={index} className="flex-shrink-0 relative">
//                             <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
//                               {item.images?.[0] ? (
//                                 <img 
//                                   src={item.images[0]} 
//                                   alt={item.productName} 
//                                   className="w-full h-full object-cover"
//                                   loading="lazy"
//                                 />
//                               ) : (
//                                 <div className="w-full h-full flex items-center justify-center text-gray-400">
//                                   <FiPackage size={20} />
//                                 </div>
//                               )}
//                             </div>
//                             {index === 4 && order.items.length > 5 && (
//                               <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs font-bold">
//                                 +{order.items.length - 5}
//                               </div>
//                             )}
//                           </div>
//                         ))}
//                       </div>
//                     </div>

//                     <div className="mt-4 pt-4 border-t border-gray-100">
//                       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//                         <div className="mb-3 sm:mb-0">
//                           <h4 className="text-sm font-medium text-gray-500">Delivery Address</h4>
//                           <p className="text-gray-900 line-clamp-1">
//                             {order.address_line}, {order.city}
//                           </p>
//                         </div>
//                         <div className="flex items-center space-x-4">
//                           <div>
//                             <h4 className="text-sm font-medium text-gray-500">Payment</h4>
//                             <p className="text-gray-900 capitalize">{order.payment_method.toLowerCase()}</p>
//                           </div>
//                           <Link
//                             to={`/orders/${order.order_id}`}
//                             className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-indigo-50 group"
//                           >
//                             View Details
//                             <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
//                           </Link>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </motion.div>
//               ))}
//             </AnimatePresence>
//           </motion.div>
//         )}
//       </div>
//     </motion.div>
//   );
// };

// export default OrdersPage;