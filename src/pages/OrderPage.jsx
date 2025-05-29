import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiMapPin, FiEdit, FiTrash2, FiPackage } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import AddressModal from '../Modal/AddressModal';

const RAZORPAY_TEST_KEY = 'rzp_test_jJEsSzUJQWCaBh'; // Replace with your test key

const OrderPage = () => {
  const { user, cartItems, addresses, createOrder, verifyPayment } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [message, setMessage] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const razorpayLoaded = useRef(false);

  // Load Razorpay script on component mount
  useEffect(() => {
    if (razorpayLoaded.current || window.Razorpay) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      razorpayLoaded.current = true;
      console.log('Razorpay script loaded successfully');
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      navigate('/cart');
    } else {
      const defaultAddress = addresses.find((addr) => addr.is_default);
      setSelectedAddress(defaultAddress || addresses[0] || null);
    }
    setLoading(false);
  }, [user, cartItems, addresses, navigate]);

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleDeleteAddress = async (address_id) => {
    try {
      const { deleteAddress } = useContext(AuthContext);
      const result = await deleteAddress(address_id);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        if (selectedAddress?.address_id === address_id) {
          setSelectedAddress(addresses.find((addr) => addr.address_id !== address_id) || null);
        }
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete address' });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setMessage({ type: 'error', text: 'Please select or add an address' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
  
    setIsPlacingOrder(true);
    setMessage(null);
  
    try {
      const orderData = {
        address_id: selectedAddress.address_id,
        payment_method: paymentMethod,
      };
      
      const result = await createOrder(orderData);
  
      if (!result.success) {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Failed to place order',
        });
        return;
      }
  
      if (paymentMethod === 'COD') {
        setMessage({ 
          type: 'success', 
          text: 'Order placed successfully!' 
        });
        setTimeout(() => navigate('/orders'), 2000);
        return;
      }

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        // Attempt to load if not available
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = () => {
            razorpayLoaded.current = true;
            resolve();
          };
          script.onerror = () => {
            reject(new Error('Failed to load Razorpay script'));
          };
          document.body.appendChild(script);
        });
      }

      // Razorpay payment handling
      const options = {
        key: RAZORPAY_TEST_KEY,
        amount: result.order.amount * 100,
        currency: 'INR',
        name: 'E-Shop',
        description: `Order #${result.order.order_id}`,
        order_id: result.order.razorpay_order_id,
        handler: async (response) => {
          try {
            console.log('Payment success response:', response);
            const verifyResult = await verifyPayment({
              order_id: result.order.order_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            if (verifyResult.success) {
              setMessage({ 
                type: 'success', 
                text: 'Payment successful! Order placed.' 
              });
              setTimeout(() => navigate('/orders'), 2000);
            } else {
              setMessage({ 
                type: 'error', 
                text: verifyResult.message || 'Payment verification failed'
              });
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setMessage({ 
              type: 'error', 
              text: 'Failed to verify payment' 
            });
          }
        },
        prefill: {
          name: user.first_name || 'Customer',
          email: user.email || 'customer@example.com',
          contact: user.phone || '9999999999',
        },
        theme: {
          color: '#4F46E5',
        },
        modal: {
          ondismiss: () => {
            setMessage({
              type: 'info',
              text: 'Payment window closed'
            });
          }
        }
      };
  
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', (response) => {
        console.error('Payment failed:', response.error);
        setMessage({
          type: 'error',
          text: `Payment failed: ${response.error.description}`
        });
      });
      
      rzp.open();
    } catch (err) {
      console.error('Order placement error:', err);
      setMessage({ 
        type: 'error', 
        text: err.message || 'Failed to place order. Please try again.',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const calculateTotal = () => {
    return cartItems
      .reduce((total, item) => total + (parseFloat(item.price) || 0) * item.quantity, 0)
      .toFixed(2);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md text-center">
        <p className="mb-4">{error}</p>
        <Link to="/" className="text-indigo-600 hover:underline">Return to Home</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Complete Your Order</h1>

        {message && (
          <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 
                         message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              {cartItems.map((item) => (
                <div key={item.cartId} className="flex items-center border-b py-4">
                  <div className="w-16 h-16 flex-shrink-0 mr-4 rounded-md overflow-hidden bg-gray-100">
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
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{item.productName}</h3>
                    <p className="text-gray-500">₹{parseFloat(item.price).toFixed(2)} x {item.quantity}</p>
                  </div>
                  <p className="text-gray-900 font-medium">₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              <div className="flex justify-end mt-4">
                <p className="text-lg font-medium text-gray-900">Total: ₹{calculateTotal()}</p>
              </div>
            </div>

            {/* Address Selection */}
            <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Delivery Address</h2>
                <button
                  onClick={handleAddAddress}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Add New Address
                </button>
              </div>
              
              {addresses.length === 0 ? (
                <p className="text-gray-500">No addresses available. Please add an address.</p>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.address_id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedAddress?.address_id === address.address_id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                      onClick={() => handleAddressSelect(address)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {address.address_line}, {address.city}, {address.state}
                          </p>
                          <p className="text-gray-600">{address.country} - {address.zip_code}</p>
                          <p className="text-gray-600 mt-1">Phone: {address.phone}</p>
                          {address.is_default && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAddress(address);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 p-1"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAddress(address.address_id);
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200 h-fit sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <div className="space-y-4 mb-6">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'Razorpay' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => setPaymentMethod('Razorpay')}
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Razorpay"
                    checked={paymentMethod === 'Razorpay'}
                    onChange={() => {}}
                    className="mr-3"
                  />
                  <div>
                    <span className="text-gray-700 font-medium">Pay with Razorpay</span>
                    <p className="text-sm text-gray-500 mt-1">Credit/Debit Card, UPI, Net Banking</p>
                  </div>
                </label>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'COD' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => setPaymentMethod('COD')}
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => {}}
                    className="mr-3"
                  />
                  <div>
                    <span className="text-gray-700 font-medium">Cash on Delivery</span>
                    <p className="text-sm text-gray-500 mt-1">Pay when you receive your order</p>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">₹{calculateTotal()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-900">₹0.00</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>Total</span>
                <span>₹{calculateTotal()}</span>
              </div>
            </div>
            
            <button
              onClick={handlePlaceOrder}
              className={`w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 flex items-center justify-center ${
                isPlacingOrder ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              disabled={!selectedAddress || isPlacingOrder}
            >
              {isPlacingOrder ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </button>
            
            <p className="text-xs text-gray-500 mt-4">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

      </div>
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={() => {
          setIsAddressModalOpen(false);
        }}
        initialAddress={editingAddress}
      />
    </div>
  );
};

export default OrderPage;