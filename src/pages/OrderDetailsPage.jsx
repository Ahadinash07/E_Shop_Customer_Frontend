import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiChevronLeft, FiPackage, FiTruck, FiCheckCircle, 
  FiXCircle, FiClock, FiCreditCard, FiMapPin,
  FiPrinter, FiShare2, FiShoppingBag, FiDownload,
  FiMessageSquare, FiRepeat, FiHelpCircle, FiCalendar,
  FiDollarSign,
  FiArrowRight
} from 'react-icons/fi';
import { FaBoxOpen, FaMoneyBillWave, FaRegCreditCard } from 'react-icons/fa';
import { RiRefund2Line, RiCustomerService2Line } from 'react-icons/ri';
import { BsShieldCheck } from 'react-icons/bs';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const ProductImage = ({ product = {}, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = product.images?.[0] || null;
  // const navigate = useNavigate();

  return (
    <div className={`bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
      {imageUrl && !imageError ? (
        <motion.img
          src={imageUrl}
          alt={product.productName || 'Product image'}
          className="w-full h-full object-cover cursor-pointer"
          // initial={{ opacity: 0 }}
          // animate={{ opacity: 1 }}
          // transition={{ duration: 0.3 }}
          onError={() => setImageError(true)}
          navi
          loading="lazy"
          // onClick={() => navigate(`/product/${product.productId}`)}
          
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <FiPackage className="text-gray-400 text-xl" />
        </div>
      )}
    </div>
  );
};

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const { getOrderDetails, cancelOrder } = useContext(AuthContext);
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const result = await getOrderDetails(orderId);
        
        if (result.success) {
          const orderData = result.order.order || {};
          const itemsData = result.order.items || [];
          const trackingData = result.order.tracking || [];
          
          const normalizedAddress = {
            line: orderData.address_line || 'Not specified',
            city: orderData.city || '',
            state: orderData.state || '',
            country: orderData.country || '',
            zip_code: orderData.zip_code || '',
            phone: orderData.phone || 'Not provided'
          };
          
          setOrder({
            order_id: orderData.order_id || orderId,
            total_amount: orderData.total_amount || 0,
            payment_method: orderData.payment_method || 'Not specified',
            payment_status: orderData.payment_status || 'Pending',
            order_status: orderData.order_status || 'Pending',
            created_at: orderData.created_at || new Date().toISOString(),
            address: normalizedAddress,
            items: itemsData.map(item => ({
              ...item,
              price: Number(item.price) || 0,
              quantity: Number(item.quantity) || 1,
              productName: item.productName || 'Unnamed Product',
              description: item.description || 'No description available',
              images: item.images || []
            })),
            tracking: trackingData.map(track => ({
              ...track,
              status: track.status || 'Pending',
              update_time: track.update_time || new Date().toISOString(),
              notes: track.notes || 'Status update'
            }))
          });
        } else {
          setError(result.message || 'Failed to load order details');
        }
      } catch (err) {
        setError('An error occurred while loading order details');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, getOrderDetails]);

  const formatCurrency = (value) => {
    return '₹' + (Number(value) || 0).toFixed(2);
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const handleCancelOrder = async () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      const result = await cancelOrder(orderId);
      if (result.success) {
        setMessage({ type: 'success', text: 'Order cancelled successfully' });
        setOrder(prev => ({ ...prev, order_status: 'Cancelled' }));
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to cancel order' });
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Order #${orderId.substring(0, 8).toUpperCase()}`,
        text: `View my order details for ${orderId.substring(0, 8).toUpperCase()}`,
        url: window.location.href
      });
    } catch (err) {
      navigator.clipboard.writeText(window.location.href);
      setMessage({ type: 'success', text: 'Order link copied to clipboard!' });
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return 'bg-emerald-100 text-emerald-800';
      case 'Cancelled': return 'bg-rose-100 text-rose-800';
      case 'Pending': return 'bg-amber-100 text-amber-800';
      case 'Shipped': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-800';
      case 'Failed': return 'bg-rose-100 text-rose-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (error) return (
    <EmptyState 
      icon={<FiXCircle size={48} className="text-red-500" />}
      title="Error loading order"
      description={error}
      actions={[
        { 
          label: 'Back to Orders', 
          to: '/orders',
          className: 'bg-indigo-600 text-white hover:bg-indigo-700'
        }
      ]}
    />
  );

  if (!order) return (
    <EmptyState 
      icon={<FaBoxOpen size={48} className="text-gray-400" />}
      title="Order not found"
      description="We couldn't find details for this order"
      actions={[
        { 
          label: 'Back to Orders', 
          to: '/orders',
          className: 'bg-indigo-600 text-white hover:bg-indigo-700'
        },
        { 
          label: 'Continue Shopping', 
          to: '/',
          className: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }
      ]}
    />
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Order Summary */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <button
                onClick={() => navigate('/orders')}
                className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4 group transition-colors"
              >
                <FiChevronLeft className="mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Orders
              </button>
              
              <div className="flex items-center flex-wrap gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Order #{order.order_id.substring(0, 8).toUpperCase()}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                  {order.order_status}
                </span>
              </div>
              
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <FiCalendar className="mr-1.5" size={14} />
                  <span>Placed on {formatDate(order.created_at)}</span>
                </div>
                <div className="flex items-center">
                  <FiShoppingBag className="mr-1.5" size={14} />
                  <span>{order.items.length} items</span>
                </div>
                <div className="flex items-center">
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FiPrinter className="mr-2" />
                Print Invoice
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FiShare2 className="mr-2" />
                Share Order
              </button>
              {['Pending', 'Confirmed'].includes(order.order_status) && (
                <button
                  onClick={handleCancelOrder}
                  className="flex items-center px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                >
                  <FiXCircle className="mr-2" />
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {message.type === 'success' ? (
                    <FiCheckCircle className="mr-2" />
                  ) : (
                    <FiXCircle className="mr-2" />
                  )}
                  {message.text}
                </div>
                <button onClick={() => setMessage(null)} className="text-current hover:opacity-80">
                  <FiXCircle />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Order Details
            </button>
            <button
              onClick={() => setActiveTab('invoice')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'invoice' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Invoice
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'support' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Support
            </button>
          </nav>
        </div>

        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items Card */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <FiShoppingBag className="mr-2 text-indigo-500" />
                    Order Items ({order.items.length})
                  </h2>
                  
                  <div className="divide-y divide-gray-200">
                    {order.items.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="py-4"
                      >
                        <div className="flex items-start">
                          <div className="w-20 h-20 flex-shrink-0 mr-4">
                            <ProductImage product={item} className="w-full h-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                              {item.productName}
                            </h3>
                            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                              {item.description}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                              Qty: {item.quantity}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 transition-colors">
                                Buy Again
                              </button>
                              <button className="text-sm text-gray-600 hover:text-gray-800 font-medium px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors">
                                View Product
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-900 font-medium">
                              {formatCurrency(item.price)}
                            </p>
                            <p className="text-gray-900 font-medium mt-1">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">FREE</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium">₹0.00</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3 mt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>{formatCurrency(order.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Tracking */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center">
                    <FiTruck className="mr-2 text-indigo-500" />
                    Order Tracking
                  </h2>
                  
                  {order.tracking.length > 0 ? (
                    <div className="relative">
                      <div className="absolute left-5 top-0 h-full w-0.5 bg-gray-200"></div>
                      {order.tracking.map((track, index) => (
                        <div key={index} className="relative pl-10 pb-6 last:pb-0">
                          <div className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            track.status === 'Delivered' ? 'bg-emerald-100 text-emerald-600' :
                            track.status === 'Cancelled' ? 'bg-rose-100 text-rose-600' :
                            track.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {track.status === 'Delivered' ? <FiCheckCircle size={18} /> :
                             track.status === 'Cancelled' ? <FiXCircle size={18} /> :
                             track.status === 'Pending' ? <FiClock size={18} /> :
                             <FiTruck size={18} />}
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-gray-900 capitalize">{track.status.toLowerCase()}</p>
                              <p className="text-sm text-gray-500">
                                {formatDate(track.update_time)}
                              </p>
                            </div>
                            {track.notes && (
                              <p className="text-sm text-gray-600 mt-1">{track.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No tracking information available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Order Information */}
            <div className="space-y-6">
              {/* Delivery Address */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <FiMapPin className="mr-2 text-indigo-500" />
                    Delivery Address
                  </h2>
                  <div className="space-y-3">
                    <p className="text-gray-900 font-medium">{order.address.line}</p>
                    <p className="text-gray-600">
                      {order.address.city}{order.address.city && order.address.state ? ', ' : ''}
                      {order.address.state}
                    </p>
                    <p className="text-gray-600">
                      {order.address.zip_code}{order.address.zip_code && order.address.country ? ', ' : ''}
                      {order.address.country}
                    </p>
                    <div className="pt-2 mt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Phone:</span> {order.address.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <FiCreditCard className="mr-2 text-indigo-500" />
                    Payment Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                      <div className="flex items-center">
                        <div className="bg-indigo-50 p-2 rounded-md mr-3">
                          {order.payment_method === 'Credit Card' ? (
                            <FaRegCreditCard className="text-indigo-600" />
                          ) : (
                            <FaMoneyBillWave className="text-green-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{order.payment_method.toLowerCase()}</p>
                          
                        </div>
                      </div>
                    </div>
                    
                    
                    
                    <div className="pt-4 mt-2 border-t border-gray-100">
                      <div className="flex items-center text-sm text-gray-600">
                        <BsShieldCheck className="mr-2 text-emerald-500" />
                        <span>Your payment is secured with SSL encryption</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Support */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <RiCustomerService2Line className="mr-2 text-indigo-500" />
                    Need Help?
                  </h2>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <div className="flex items-center">
                        <FiMessageSquare className="mr-3 text-gray-600" />
                        <span>Chat with Support</span>
                      </div>
                      <FiArrowRight className="text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <div className="flex items-center">
                        <FiHelpCircle className="mr-3 text-gray-600" />
                        <span>FAQs</span>
                      </div>
                      <FiArrowRight className="text-gray-400" />
                    </button>
                    {/* <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                      <div className="flex items-center">
                        <RiRefund2Line className="mr-3 text-gray-600" />
                        <span>Request Return</span>
                      </div>
                      <FiArrowRight className="text-gray-400" />
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoice' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold">Invoice</h2>
              <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <FiDownload className="mr-2" />
                Download Invoice
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-medium mb-2">Billing Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{order.address.line}</p>
                  <p className="text-gray-600">
                    {order.address.city}{order.address.city && order.address.state ? ', ' : ''}
                    {order.address.state}
                  </p>
                  <p className="text-gray-600">
                    {order.address.zip_code}{order.address.zip_code && order.address.country ? ', ' : ''}
                    {order.address.country}
                  </p>
                  <p className="text-gray-600 mt-2">Phone: {order.address.phone}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Payment Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="bg-indigo-50 p-2 rounded-md mr-3">
                      {order.payment_method === 'Credit Card' ? (
                        <FaRegCreditCard className="text-indigo-600" />
                      ) : (
                        <FaMoneyBillWave className="text-green-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{order.payment_method.toLowerCase()}</p>
                      <p className="text-sm text-gray-500">Paid on {formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  {/* <p className="text-sm text-gray-600">
                    <span className="font-medium">Status:</span> {order.payment_status}
                  </p> */}
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 mr-4">
                            <ProductImage product={item} className="h-10 w-10" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{item.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-8 flex justify-end">
              <div className="w-full max-w-md">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">₹0.00</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <RiCustomerService2Line className="mr-2 text-indigo-500" />
                Contact Support
              </h2>
              <p className="text-gray-600 mb-6">
                Our customer support team is available 24/7 to assist you with any questions or issues regarding your order.
              </p>
              
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <FiMessageSquare className="mr-3 text-indigo-600" />
                    <span className="font-medium">Live Chat</span>
                  </div>
                  <FiArrowRight className="text-indigo-400" />
                </button>
                
                <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <FiMessageSquare className="mr-3 text-gray-600" />
                    <span className="font-medium">Email Support</span>
                  </div>
                  <FiArrowRight className="text-gray-400" />
                </button>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FiHelpCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Need immediate help?</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Call us at <span className="font-medium">+1 (555) 123-4567</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <RiRefund2Line className="mr-2 text-indigo-500" />
                Returns & Refunds
              </h2>
              <p className="text-gray-600 mb-6">
                If you're not completely satisfied with your purchase, you may be eligible for a return or refund.
              </p>
              
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <FiRepeat className="mr-3 text-indigo-600" />
                    <span className="font-medium">Start a Return</span>
                  </div>
                  <FiArrowRight className="text-indigo-400" />
                </button>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-800 mb-2">Return Policy</h3>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                    <li>30-day return policy</li>
                    <li>Items must be unused and in original packaging</li>
                    <li>Free return shipping for eligible items</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BsShieldCheck className="mr-2 text-indigo-500" />
                Order Protection
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-800 mb-2">Shipping Protection</h3>
                  <p className="text-sm text-gray-600">
                    Your order is protected against loss, damage, or theft during shipping. If any issues occur, we'll replace your items at no additional cost.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-800 mb-2">Authenticity Guarantee</h3>
                  <p className="text-sm text-gray-600">
                    We guarantee that all products are 100% authentic. If you receive a counterfeit item, you'll receive a full refund plus return shipping.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsPage;























































// import React, { useState, useEffect, useContext } from 'react';
// import { useParams, useNavigate, Link } from 'react-router-dom';
// import { AuthContext } from '../context/AuthContext';
// import { motion, AnimatePresence } from 'framer-motion';
// import { 
//   FiChevronLeft, FiPackage, FiTruck, FiCheckCircle, 
//   FiXCircle, FiClock, FiCreditCard, FiMapPin,
//   FiPrinter, FiShare2, FiShoppingBag, FiInfo, FiAlertCircle,
//   FiCalendar, FiDollarSign, FiBox, FiRefreshCw, FiMessageSquare
// } from 'react-icons/fi';
// import { FaShippingFast, FaBoxOpen, FaMoneyBillWave } from 'react-icons/fa';
// // import { RiRefund2Line, RiCouponLine } from 'react-icons/ri';
// import LoadingSpinner from '../components/LoadingSpinner';
// import EmptyState from '../components/EmptyState';
// // import StatusBadge from '../components/StatusBadge';

// const ProductImage = ({ product = {}, className = '' }) => {
//   const [imageError, setImageError] = useState(false);
//   const imageUrl = product.images?.[0] || null;

//   return (
//     <div className={`bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
//       {imageUrl && !imageError ? (
//         <motion.img
//           src={imageUrl}
//           alt={product.productName || 'Product image'}
//           className="w-full h-full object-cover"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.3 }}
//           onError={() => setImageError(true)}
//           loading="lazy"
//         />
//       ) : (
//         <div className="w-full h-full flex items-center justify-center bg-gray-200">
//           <FiPackage className="text-gray-400 text-xl" />
//         </div>
//       )}
//     </div>
//   );
// };

// const OrderDetailsPage = () => {
//   const { orderId } = useParams();
//   const { getOrderDetails, cancelOrder } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const [order, setOrder] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState(null);
//   const [activeTab, setActiveTab] = useState('details');

//   useEffect(() => {
//     const fetchOrderDetails = async () => {
//       try {
//         setLoading(true);
//         const result = await getOrderDetails(orderId);
        
//         if (result.success) {
//           const orderData = result.order.order || {};
//           const itemsData = result.order.items || [];
//           const trackingData = result.order.tracking || [];
          
//           const normalizedAddress = {
//             line: orderData.address_line || 'Not specified',
//             city: orderData.city || '',
//             state: orderData.state || '',
//             country: orderData.country || '',
//             zip_code: orderData.zip_code || '',
//             phone: orderData.phone || 'Not provided'
//           };
          
//           setOrder({
//             order_id: orderData.order_id || orderId,
//             total_amount: orderData.total_amount || 0,
//             payment_method: orderData.payment_method || 'Not specified',
//             payment_status: orderData.payment_status || 'Pending',
//             order_status: orderData.order_status || 'Pending',
//             created_at: orderData.created_at || new Date().toISOString(),
//             address: normalizedAddress,
//             items: itemsData.map(item => ({
//               ...item,
//               price: Number(item.price) || 0,
//               quantity: Number(item.quantity) || 1,
//               productName: item.productName || 'Unnamed Product',
//               description: item.description || 'No description available',
//               images: item.images || []
//             })),
//             tracking: trackingData.map(track => ({
//               ...track,
//               status: track.status || 'Pending',
//               update_time: track.update_time || new Date().toISOString(),
//               notes: track.notes || 'Status update'
//             }))
//           });
//         } else {
//           setError(result.message || 'Failed to load order details');
//         }
//       } catch (err) {
//         setError('An error occurred while loading order details');
//         console.error('Error:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderDetails();
//   }, [orderId, getOrderDetails]);

//   const formatCurrency = (value) => {
//     return '₹' + (Number(value) || 0).toFixed(2);
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const handleCancelOrder = async () => {
//     if (window.confirm('Are you sure you want to cancel this order?')) {
//       const result = await cancelOrder(orderId);
//       if (result.success) {
//         setMessage({ type: 'success', text: 'Order cancelled successfully' });
//         setOrder(prev => ({ ...prev, order_status: 'Cancelled' }));
//       } else {
//         setMessage({ type: 'error', text: result.message || 'Failed to cancel order' });
//       }
//     }
//   };

//   const handlePrint = () => {
//     window.print();
//   };

//   const handleShare = async () => {
//     try {
//       await navigator.share({
//         title: `Order #${orderId.substring(0, 8).toUpperCase()}`,
//         text: `View my order details for ${orderId.substring(0, 8).toUpperCase()}`,
//         url: window.location.href
//       });
//     } catch (err) {
//       navigator.clipboard.writeText(window.location.href);
//       setMessage({ type: 'success', text: 'Order link copied to clipboard!' });
//     }
//   };

//   const getStatusColor = (status) => {
//     switch(status) {
//       case 'Delivered': return 'bg-emerald-500/10 text-emerald-600';
//       case 'Cancelled': return 'bg-rose-500/10 text-rose-600';
//       case 'Pending': return 'bg-amber-500/10 text-amber-600';
//       case 'Shipped': return 'bg-blue-500/10 text-blue-600';
//       default: return 'bg-gray-500/10 text-gray-600';
//     }
//   };

//   if (loading) return <LoadingSpinner fullScreen />;

//   if (error) return (
//     <EmptyState 
//       icon={<FiXCircle size={48} className="text-red-500" />}
//       title="Error loading order"
//       description={error}
//       actions={[
//         { 
//           label: 'Back to Orders', 
//           to: '/orders',
//           className: 'bg-indigo-600 text-white hover:bg-indigo-700'
//         }
//       ]}
//     />
//   );

//   if (!order) return (
//     <EmptyState 
//       icon={<FiPackage size={48} className="text-yellow-500" />}
//       title="Order not found"
//       description="We couldn't find details for this order"
//       actions={[
//         { 
//           label: 'Back to Orders', 
//           to: '/orders',
//           className: 'bg-indigo-600 text-white hover:bg-indigo-700'
//         },
//         { 
//           label: 'Continue Shopping', 
//           to: '/',
//           className: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
//         }
//       ]}
//     />
//   );

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header with Order Summary */}
//       <div className="bg-white shadow-sm border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//             <div>
//               <button
//                 onClick={() => navigate('/orders')}
//                 className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4 group transition-colors"
//               >
//                 <FiChevronLeft className="mr-1 group-hover:-translate-x-1 transition-transform" />
//                 Back to Orders
//               </button>
//               <div className="flex items-center space-x-4">
//                 <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
//                   Order #{order.order_id.substring(0, 8).toUpperCase()}
//                 </h1>
//                 <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
//                   {order.order_status}
//                 </span>
//               </div>
//               <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
//                 <span className="flex items-center">
//                   <FiCalendar className="mr-1.5" size={14} />
//                   {formatDate(order.created_at)}
//                 </span>
//                 <span className="flex items-center">
                  
//                   {formatCurrency(order.total_amount)}
//                 </span>
//                 <span className="flex items-center">
//                   <FiShoppingBag className="mr-1.5" size={14} />
//                   {order.items.length} items
//                 </span>
//               </div>
//             </div>
//             <div className="flex space-x-3 mt-4 md:mt-0">
//               <button 
//                 onClick={handlePrint}
//                 className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//               >
//                 <FiPrinter className="mr-2" />
//                 Print
//               </button>
//               <button 
//                 onClick={handleShare}
//                 className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//               >
//                 <FiShare2 className="mr-2" />
//                 Share
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <AnimatePresence>
//           {message && (
//             <motion.div
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className={`mb-6 p-4 rounded-lg ${
//                 message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//               }`}
//             >
//               <div className="flex items-center">
//                 {message.type === 'success' ? (
//                   <FiCheckCircle className="mr-2" />
//                 ) : (
//                   <FiAlertCircle className="mr-2" />
//                 )}
//                 {message.text}
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Navigation Tabs */}
//         <div className="mb-8 border-b border-gray-200">
//           <nav className="-mb-px flex space-x-8">
//             <button
//               onClick={() => setActiveTab('details')}
//               className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
//             >
//               <div className="flex items-center">
//                 <FiInfo className="mr-2" />
//                 Order Details
//               </div>
//             </button>
//             <button
//               onClick={() => setActiveTab('tracking')}
//               className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'tracking' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
//             >
//               <div className="flex items-center">
//                 <FiTruck className="mr-2" />
//                 Tracking
//               </div>
//             </button>
//           </nav>
//         </div>

//         {/* Order Details Tab */}
//         {activeTab === 'details' && (
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Left Column - Order Items */}
//             <div className="lg:col-span-2">
//               <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
//                 <div className="p-6">
//                   <h2 className="text-xl font-semibold mb-6 flex items-center">
//                     <FiShoppingBag className="mr-2 text-indigo-500" />
//                     Order Items ({order.items.length})
//                   </h2>
                  
//                   <div className="divide-y divide-gray-200">
//                     {order.items.map((item, index) => (
//                       <motion.div
//                         key={index}
//                         initial={{ opacity: 0, y: 10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ delay: index * 0.05 }}
//                         className="py-4"
//                       >
//                         <div className="flex items-start">
//                           <div className="w-20 h-20 flex-shrink-0 mr-4">
//                             <ProductImage product={item} className="h-full" />
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
//                               {item.productName}
//                             </h3>
//                             <p className="text-gray-500 text-sm mt-1 line-clamp-2">
//                               {item.description}
//                             </p>
//                             <p className="text-gray-500 text-sm mt-1">
//                               Qty: {item.quantity}
//                             </p>
//                             <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
//                               Buy Again
//                             </button>
//                           </div>
//                           <div className="text-right">
//                             <p className="text-gray-900 font-medium">
//                               {formatCurrency(item.price)}
//                             </p>
//                             <p className="text-gray-900 font-medium mt-1">
//                               {formatCurrency(item.price * item.quantity)}
//                             </p>
//                           </div>
//                         </div>
//                       </motion.div>
//                     ))}
//                   </div>

//                   {/* Order Summary */}
//                   <div className="mt-8 pt-6 border-t border-gray-200">
//                     <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
//                     <div className="space-y-3">
//                       <div className="flex justify-between">
//                         <span className="text-gray-600">Subtotal</span>
//                         <span className="font-medium">{formatCurrency(order.total_amount)}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-600">Shipping</span>
//                         <span className="font-medium">₹0.00</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-600">Tax</span>
//                         <span className="font-medium">₹0.00</span>
//                       </div>
//                       <div className="border-t border-gray-200 my-2"></div>
//                       <div className="flex justify-between font-bold text-lg">
//                         <span>Total</span>
//                         <span>{formatCurrency(order.total_amount)}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Right Column - Order Info */}
//             <div className="space-y-6">
//               {/* Delivery Address */}
//               <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
//                 <div className="p-6">
//                   <h2 className="text-xl font-semibold mb-4 flex items-center">
//                     <FiMapPin className="mr-2 text-indigo-500" />
//                     Delivery Address
//                   </h2>
//                   <div className="space-y-2">
//                     <p className="text-gray-900 font-medium">{order.address.line}</p>
//                     <p className="text-gray-600">
//                       {order.address.city}{order.address.city && order.address.state ? ', ' : ''}
//                       {order.address.state}
//                     </p>
//                     <p className="text-gray-600">
//                       {order.address.zip_code}{order.address.zip_code && order.address.country ? ', ' : ''}
//                       {order.address.country}
//                     </p>
//                     <p className="text-gray-600 mt-3">
//                       <span className="font-medium">Phone:</span> {order.address.phone}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Payment Information */}
//               <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
//                 <div className="p-6">
//                   <h2 className="text-xl font-semibold mb-4 flex items-center">
//                     <FiCreditCard className="mr-2 text-indigo-500" />
//                     Payment Information
//                   </h2>
//                   <div className="space-y-4">
//                     <div>
//                       <p className="text-gray-600 text-sm">Payment Method</p>
//                       <div className="flex items-center mt-1">
//                         <div className="bg-indigo-50 p-2 rounded-md mr-3">
//                           {order.payment_method === 'Credit Card' ? (
//                             <div className="w-8 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-sm"></div>
//                           ) : (
//                             <FaMoneyBillWave className="text-green-500" />
//                           )}
//                         </div>
//                         <div>
//                           <p className="font-medium capitalize">{order.payment_method.toLowerCase()}</p>
//                         </div>
//                       </div>
//                     </div>
//                     <div>
//                       <p className="text-gray-600 text-sm">Payment Status</p>
//                       <p className={`mt-1 ${
//                         order.payment_status === 'Completed' ? 'text-green-600' : 
//                         order.payment_status === 'Failed' ? 'text-red-600' : 'text-yellow-600'
//                       }`}>
//                         {order.payment_status}
//                       </p>
//                     </div>
//                     {['Pending', 'Confirmed'].includes(order.order_status) && (
//                       <button
//                         onClick={handleCancelOrder}
//                         className="w-full mt-4 bg-red-50 text-red-600 py-2.5 px-4 rounded-lg hover:bg-red-100 border border-red-200 font-medium transition-colors flex items-center justify-center"
//                       >
//                         <FiXCircle className="mr-2" />
//                         Cancel Order
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Customer Support */}
//               <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
//                 <div className="p-6">
//                   <h2 className="text-xl font-semibold mb-4 flex items-center">
//                     <FiMessageSquare className="mr-2 text-indigo-500" />
//                     Need Help?
//                   </h2>
//                   <p className="text-gray-600 mb-4">
//                     If you have any questions about your order, our customer service team is happy to help.
//                   </p>
//                   <button className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 font-medium transition-colors">
//                     Contact Support
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Tracking Tab */}
//         {activeTab === 'tracking' && (
//           <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
//             <div className="p-6">
//               <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
//                 <h2 className="text-xl font-semibold flex items-center">
//                   <FiTruck className="mr-2 text-indigo-500" />
//                   Order Tracking
//                 </h2>
//                 <div className="mt-3 md:mt-0">
//                   <button className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
//                     <FiRefreshCw className="mr-2" />
//                     Refresh Tracking
//                   </button>
//                 </div>
//               </div>
              
//               {order.tracking.length > 0 ? (
//                 <div className="relative">
//                   {/* Timeline */}
//                   <div className="absolute left-5 top-0 h-full w-0.5 bg-gray-200"></div>
//                   {order.tracking.map((track, index) => (
//                     <div key={index} className="relative pl-12 pb-6 last:pb-0">
//                       <div className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center ${
//                         track.status === 'Delivered' ? 'bg-emerald-100 text-emerald-600' :
//                         track.status === 'Cancelled' ? 'bg-rose-100 text-rose-600' :
//                         track.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
//                         'bg-blue-100 text-blue-600'
//                       }`}>
//                         {track.status === 'Delivered' ? <FiCheckCircle size={18} /> :
//                          track.status === 'Cancelled' ? <FiXCircle size={18} /> :
//                          track.status === 'Pending' ? <FiClock size={18} /> :
//                          <FaShippingFast size={16} />}
//                       </div>
//                       <div className="bg-gray-50 rounded-lg p-4">
//                         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//                           <p className="font-medium text-gray-900 capitalize">{track.status.toLowerCase()}</p>
//                           <p className="text-sm text-gray-600 mt-1 sm:mt-0">
//                             {formatDate(track.update_time)}
//                           </p>
//                         </div>
//                         {track.notes && (
//                           <p className="text-sm text-gray-600 mt-2">{track.notes}</p>
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="bg-gray-50 rounded-lg p-6 text-center">
//                   <FaBoxOpen className="mx-auto text-gray-400 text-3xl mb-3" />
//                   <p className="text-gray-600">No tracking information available yet</p>
//                   <p className="text-gray-500 text-sm mt-1">
//                     Tracking details will appear here once your order is processed
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default OrderDetailsPage;

















































// import React, { useState, useEffect, useContext } from 'react';
// import { useParams, useNavigate, Link } from 'react-router-dom';
// import { AuthContext } from '../context/AuthContext';
// import { motion, AnimatePresence } from 'framer-motion';
// import { 
//   FiChevronLeft, FiPackage, FiTruck, FiCheckCircle, 
//   FiXCircle, FiClock, FiCreditCard, FiMapPin,
//   FiPrinter, FiShare2, FiShoppingBag
// } from 'react-icons/fi';
// import LoadingSpinner from '../components/LoadingSpinner';
// import EmptyState from '../components/EmptyState';

// const ProductImage = ({ product = {}, className = '' }) => {
//   const [imageError, setImageError] = useState(false);
//   const imageUrl = product.images?.[0] || null;

//   return (
//     <div className={`bg-gray-100 rounded-md overflow-hidden flex items-center justify-center ${className}`}>
//       {imageUrl && !imageError ? (
//         <motion.img
//           src={imageUrl}
//           alt={product.productName || 'Product image'}
//           className="w-full h-full object-cover"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.3 }}
//           onError={() => setImageError(true)}
//           loading="lazy"
//         />
//       ) : (
//         <div className="w-full h-full flex items-center justify-center bg-gray-200">
//           <FiPackage className="text-gray-400 text-xl" />
//         </div>
//       )}
//     </div>
//   );
// };

// const OrderDetailsPage = () => {
//   const { orderId } = useParams();
//   const { getOrderDetails, cancelOrder } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const [order, setOrder] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [message, setMessage] = useState(null);

//   useEffect(() => {
//     const fetchOrderDetails = async () => {
//       try {
//         setLoading(true);
//         const result = await getOrderDetails(orderId);
        
//         if (result.success) {
//           const orderData = result.order.order || {}; // Access result.order.order
//           const itemsData = result.order.items || []; // Access result.order.items
//           const trackingData = result.order.tracking || []; // Access result.order.tracking
          
//           // Normalize address data (flat structure from backend)
//           const normalizedAddress = {
//             line: orderData.address_line || 'Not specified',
//             city: orderData.city || '',
//             state: orderData.state || '',
//             country: orderData.country || '',
//             zip_code: orderData.zip_code || '',
//             phone: orderData.phone || 'Not provided'
//           };
          
//           console.log('Normalized address:', normalizedAddress); // Log for debugging

//           setOrder({
//             order_id: orderData.order_id || orderId,
//             total_amount: orderData.total_amount || 0,
//             payment_method: orderData.payment_method || 'Not specified',
//             payment_status: orderData.payment_status || 'Pending',
//             order_status: orderData.order_status || 'Pending',
//             created_at: orderData.created_at || new Date().toISOString(),
//             address: normalizedAddress,
//             items: itemsData.map(item => ({
//               ...item,
//               price: Number(item.price) || 0,
//               quantity: Number(item.quantity) || 1,
//               productName: item.productName || 'Unnamed Product',
//               description: item.description || 'No description available',
//               images: item.images || []
//             })),
//             tracking: trackingData.map(track => ({
//               ...track,
//               status: track.status || 'Pending',
//               update_time: track.update_time || new Date().toISOString(),
//               notes: track.notes || 'Status update'
//             }))
//           });
//         } else {
//           setError(result.message || 'Failed to load order details');
//         }
//       } catch (err) {
//         setError('An error occurred while loading order details');
//         console.error('Error:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrderDetails();
//   }, [orderId, getOrderDetails]);

//   const formatCurrency = (value) => {
//     return '₹' + (Number(value) || 0).toFixed(2);
//   };

//   const handleCancelOrder = async () => {
//     if (window.confirm('Are you sure you want to cancel this order?')) {
//       const result = await cancelOrder(orderId);
//       if (result.success) {
//         setMessage({ type: 'success', text: 'Order cancelled successfully' });
//         setOrder(prev => ({ ...prev, order_status: 'Cancelled' }));
//       } else {
//         setMessage({ type: 'error', text: result.message || 'Failed to cancel order' });
//       }
//     }
//   };

//   const handlePrint = () => {
//     window.print();
//   };

//   const handleShare = async () => {
//     try {
//       await navigator.share({
//         title: `Order #${orderId.substring(0, 8).toUpperCase()}`,
//         text: `View my order details for ${orderId.substring(0, 8).toUpperCase()}`,
//         url: window.location.href
//       });
//     } catch (err) {
//       navigator.clipboard.writeText(window.location.href);
//       setMessage({ type: 'success', text: 'Order link copied to clipboard!' });
//     }
//   };

//   if (loading) return <LoadingSpinner fullScreen />;

//   if (error) return (
//     <EmptyState 
//       icon={<FiXCircle size={48} className="text-red-500" />}
//       title="Error loading order"
//       description={error}
//       actions={[
//         { label: 'Back to Orders', to: '/orders' }
//       ]}
//     />
//   );

//   if (!order) return (
//     <EmptyState 
//       icon={<FiPackage size={48} className="text-yellow-500" />}
//       title="Order not found"
//       description="We couldn't find details for this order"
//       actions={[
//         { label: 'Back to Orders', to: '/orders' },
//         { label: 'Continue Shopping', to: '/' }
//       ]}
//     />
//   );

//   return (
//     <div className="bg-gray-50 min-h-screen py-8">
//       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
//         <AnimatePresence>
//           {message && (
//             <motion.div
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className={`mb-6 p-4 rounded-lg ${
//                 message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//               }`}
//             >
//               {message.text}
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Header Section */}
//         <div className="flex justify-between items-start mb-8">
//           <div>
//             <button
//               onClick={() => navigate('/orders')}
//               className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4 group"
//             >
//               <FiChevronLeft className="mr-1 group-hover:-translate-x-1 transition-transform" />
//               Back to Orders
//             </button>
//             <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
//               Order #{order.order_id.substring(0, 16).toUpperCase()}
//             </h1>
//             <div className="flex items-center mt-2 space-x-4">
//               <span className={`px-3 py-1 rounded-full text-sm font-medium ${
//                 order.order_status === 'Delivered' ? 'bg-green-100 text-green-800' :
//                 order.order_status === 'Cancelled' ? 'bg-red-100 text-red-800' :
//                 order.order_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
//                 'bg-blue-100 text-blue-800'
//               }`}>
//                 {order.order_status}
//               </span>
//             </div>
//           </div>
//           <div className="flex space-x-2">
//             <button 
//               onClick={handlePrint}
//               className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
//               title="Print order"
//             >
//               <FiPrinter size={20} />
//             </button>
//             <button 
//               onClick={handleShare}
//               className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
//               title="Share order"
//             >
//               <FiShare2 size={20} />
//             </button>
//           </div>
//         </div>

//         {/* Order Items Section */}
//         <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-6">
//           <div className="p-6">
//             <h2 className="text-xl font-semibold mb-6 flex items-center">
//               <FiShoppingBag className="mr-2 text-indigo-500" />
//               Order Items ({order.items.length})
//             </h2>
            
//             <div className="divide-y divide-gray-200">
//               {order.items.map((item, index) => (
//                 <motion.div
//                   key={index}
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: index * 0.05 }}
//                   className="py-4"
//                 >
//                   <div className="flex items-start">
//                     <div className="w-16 h-16 flex-shrink-0 mr-4">
//                       <ProductImage product={item} />
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
//                         {item.productName}
//                       </h3>
//                       <p className="text-gray-500 text-sm mt-1 line-clamp-2">
//                         {item.description}
//                       </p>
//                       <p className="text-gray-500 text-sm mt-1">
//                         Qty: {item.quantity}
//                       </p>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-gray-900 font-medium">
//                         {formatCurrency(item.price)}
//                       </p>
//                       <p className="text-gray-900 font-medium mt-1">
//                         {formatCurrency(item.price * item.quantity)}
//                       </p>
//                     </div>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>

//             <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
//               <div className="text-right space-y-2">
//                 <div className="flex justify-between min-w-[200px]">
//                   <span className="text-gray-600">Subtotal:</span>
//                   <span>{formatCurrency(order.total_amount)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Shipping:</span>
//                   <span>₹0.00</span>
//                 </div>
//                 <div className="flex justify-between font-bold text-lg pt-2">
//                   <span>Total:</span>
//                   <span>{formatCurrency(order.total_amount)}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Two Column Section */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//           {/* Delivery Address */}
//           <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
//             <div className="p-6">
//               <h2 className="text-xl font-semibold mb-4 flex items-center">
//                 <FiMapPin className="mr-2 text-indigo-500" />
//                 Delivery Address
//               </h2>
//               <div className="space-y-2">
//                 <p className="text-gray-900">{order.address.line}</p>
//                 <p className="text-gray-600">
//                   {order.address.city}{order.address.city && order.address.state ? ', ' : ''}
//                   {order.address.state}
//                 </p>
//                 <p className="text-gray-600">
//                   {order.address.zip_code}{order.address.zip_code && order.address.country ? ', ' : ''}
//                   {order.address.country}
//                 </p>
//                 <p className="text-gray-600 mt-2">
//                   Phone: {order.address.phone || 'Phone number not available'}
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Payment Information */}
//           <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
//             <div className="p-6">
//               <h2 className="text-xl font-semibold mb-4 flex items-center">
//                 <FiCreditCard className="mr-2 text-indigo-500" />
//                 Payment Information
//               </h2>
//               <div className="space-y-4">
//                 <div>
//                   <p className="text-gray-600 text-sm">Payment Method</p>
//                   <p className="text-gray-900 capitalize">{order.payment_method.toLowerCase()}</p>
//                 </div>
//                 <div>
//                   <p className="text-gray-600 text-sm">Payment Status</p>
//                   <p className={`${
//                     order.payment_status === 'Completed' ? 'text-green-600' : 
//                     order.payment_status === 'Failed' ? 'text-red-600' : 'text-yellow-600'
//                   }`}>
//                     {order.payment_status}
//                   </p>
//                 </div>
//                 {['Pending', 'Confirmed'].includes(order.order_status) && (
//                   <button
//                     onClick={handleCancelOrder}
//                     className="w-full mt-4 bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 border border-red-200 font-medium transition-colors"
//                   >
//                     Cancel Order
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Order Tracking */}
//         <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
//           <div className="p-6">
//             <h2 className="text-xl font-semibold mb-4 flex items-center">
//               <FiTruck className="mr-2 text-indigo-500" />
//               Order Tracking
//             </h2>
            
//             {order.tracking.length > 0 ? (
//               <div className="relative">
//                 <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>
//                 {order.tracking.map((track, index) => (
//                   <div key={index} className="relative pl-10 pb-4 last:pb-0">
//                     <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center">
//                       {track.status === 'Delivered' ? <FiCheckCircle className="text-green-500" /> :
//                        track.status === 'Cancelled' ? <FiXCircle className="text-red-500" /> :
//                        track.status === 'Pending' ? <FiClock className="text-yellow-500" /> :
//                        <FiTruck className="text-blue-500" />}
//                     </div>
//                     <div className="bg-gray-50 rounded-lg p-3">
//                       <p className="font-medium text-gray-900 capitalize">{track.status.toLowerCase()}</p>
//                       <p className="text-sm text-gray-600">
//                         {new Date(track.update_time).toLocaleString('en-US', {
//                           month: 'short',
//                           day: 'numeric',
//                           hour: '2-digit',
//                           minute: '2-digit'
//                         })}
//                       </p>
//                       {track.notes && (
//                         <p className="text-sm text-gray-600 mt-1">{track.notes}</p>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-gray-500">No tracking information available</p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OrderDetailsPage;
