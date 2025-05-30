import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiMic, FiSend, FiX } from 'react-icons/fi';
import axios from 'axios';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: 'Hello! How can I help you find products today?', isBot: true }]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { transcript, resetTranscript } = useSpeechRecognition();
  const messagesEndRef = useRef(null);
  const DIALOGFLOW_LANGUAGE = 'en';

  useEffect(() => {
    if (isListening) {
      SpeechRecognition.startListening({ continuous: true, language: DIALOGFLOW_LANGUAGE });
    } else {
      SpeechRecognition.stopListening();
    }
  }, [isListening]);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const newMessage = { text, isBot: false };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    resetTranscript();

    try {
      console.log('Sending request to Dialogflow with text:', text);
      const response = await axios.post('http://localhost:5376/api/dialogflow', {
        text,
        languageCode: DIALOGFLOW_LANGUAGE,
      });

      const data = response.data;
      console.log('Dialogflow Response:', data);

      if (!data.queryResult) {
        throw new Error('No queryResult in Dialogflow response');
      }

      const botResponse = data.queryResult.fulfillmentText || 'Sorry, I didn’t understand that.';
      setMessages((prev) => [...prev, { text: botResponse, isBot: true }]);

      const intent = data.queryResult.intent?.displayName;
      const params = data.queryResult.parameters || {};

      if (intent === 'product_search') {
        const queryParams = {};
        if (params.product) queryParams.query = params.product;
        if (params.category) queryParams.category = params.category;
        if (params.subcategory) queryParams.subcategory = params.subcategory;
        if (params.brand) queryParams.brand = params.brand;

        console.log('Sending /api/recommendations request with params:', queryParams);

        const productResponse = await axios.get('http://localhost:5376/api/recommendations', {
          params: queryParams,
        });

        if (productResponse.data.data.length > 0) {
          const products = productResponse.data.data;
          const productMessage = {
            text: 'Here are some product recommendations:',
            isBot: true,
            products: products.map((p) => ({
              productId: p.productId,
              productName: p.productName,
              price: p.price,
              image: p.images
                ? (() => {
                    try {
                      const parsed = JSON.parse(p.images);
                      return Array.isArray(parsed) ? parsed[0] : p.images;
                    } catch (e) {
                      return p.images;
                    }
                  })()
                : null,
            })),
          };
          setMessages((prev) => [...prev, productMessage]);
        } else {
          setMessages((prev) => [...prev, { text: `No ${params.product} found matching your request.`, isBot: true }]);
        }
      }
    } catch (error) {
      console.error('Error with Dialogflow or API:', error);
      const errorMessage = error.response?.data?.error || error.message;
      setMessages((prev) => [...prev, { text: `Error: ${errorMessage}. Please try again!`, isBot: true }]);
    }
  };

  const handleVoiceToggle = () => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert('Your browser does not support speech recognition.');
      return;
    }
    setIsListening((prev) => !prev);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="bg-indigo-400 text-white rounded-full p-4 shadow-lg"
          >
            <FiMessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-white rounded-xl shadow-xl w-80 sm:w-96 h-[500px] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 bg-indigo-600 text-white rounded-t-xl">
              <h3 className="font-bold">ShopBot</h3>
              <button onClick={() => setIsOpen(false)} className="text-white">
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.isBot ? 'bg-gray-100 text-gray-800' : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {msg.text}
                    {msg.products && (
                      <div className="mt-2 space-y-2">
                        {msg.products.map((product) => (
                          <div key={product.productId} className="flex items-center bg-white p-2 rounded-md shadow-sm">
                            {product.image && (
                              <img src={product.image} alt={product.productName} className="w-12 h-12 object-cover rounded mr-2" />
                            )}
                            <div>
                              <p className="font-medium">{product.productName}</p>
                              <p className="text-sm">₹{product.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type or speak your query..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`p-2 rounded-full ${isListening ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  <FiMic size={20} />
                </button>
                <button type="submit" className="p-2 bg-indigo-600 text-white rounded-full">
                  <FiSend size={20} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;