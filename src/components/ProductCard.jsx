import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FiShoppingCart, FiHeart } from 'react-icons/fi';

const ProductCard = ({ product = {} }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Set default values for all required product properties
  const safeProduct = {
    images: [],
    productName: 'Untitled Product',
    price: 0,
    quantity: 0,
    productId: '',
    ...product
  };

  // Fixed dimensions for all cards
  const cardWidth = '100%';
  const imageHeight = '290px';

  // Get first image or fallback to null
  const imageUrl = safeProduct.images?.[0] || null;

  const handleImageError = () => {
    console.error('Failed to load image:', imageUrl);
    setImageError(true);
  };

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col border border-gray-200"
      style={{ width: cardWidth }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link to={`/product/${safeProduct.productId}`} className="flex flex-col h-full">
        {/* Image Container with Fixed Height */}
        <div 
          className="relative bg-white overflow-hidden flex items-center justify-center"
          style={{ 
            height: imageHeight,
            minHeight: imageHeight
          }}
        >
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={safeProduct.productName}
              className="w-full h-full object-contain p-4"
              style={{
                maxHeight: '100%',
                maxWidth: '100%'
              }}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white">
              <span className="text-gray-500 text-sm">No image available</span>
            </div>
          )}

          {/* Quick Actions */}
          {isHovered && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 bg-white p-2 flex justify-center space-x-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button 
                className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100"
                onClick={(e) => e.preventDefault()}
              >
                <FiHeart className="text-gray-700" />
              </button>
              <button 
                className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100"
                onClick={(e) => e.preventDefault()}
              >
                <FiShoppingCart className="text-gray-700" />
              </button>
            </motion.div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="text-md font-semibold text-gray-800 mb-1 line-clamp-2">
            {safeProduct.productName}
          </h3>
          
          {/* Rating */}
          <div className="mt-1 mb-2 flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${star <= 4.5 ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1 text-xs text-gray-500">(24)</span>
          </div>

          {/* Price and Stock */}
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-gray-900">
                  ₹{safeProduct.price.toFixed(2)}
                </span>
                {safeProduct.originalPrice && (
                  <span className="ml-2 text-sm text-gray-500 line-through">
                    ₹{safeProduct.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <span className={`text-xs ${safeProduct.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {safeProduct.quantity > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;




























// import { Link } from 'react-router-dom';

// const ProductCard = ({ product }) => {
//   return (
//     <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
//       <Link to={`/product/${product.productId}`}>
//         <div className="relative pb-[75%] overflow-hidden">
//           {product.images && product.images.length > 0 ? (
//             <img
//               src={product.images[0]}
//               alt={product.productName}
//               className="absolute top-0 left-0 w-full h-full object-cover"
//             />
//           ) : (
//             <div className="absolute top-0 left-0 w-full h-full bg-gray-200 flex items-center justify-center">
//               <span className="text-gray-500">No Image</span>
//             </div>
//           )}
//         </div>
        
//         <div className="p-4">
//           <h3 className="text-lg font-semibold mb-2 truncate">{product.productName}</h3>
//           <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
          
//           <div className="flex items-center justify-between">
//             <span className="text-lg font-bold text-blue-600">₹{product.price.toFixed(2)}</span>
//             {product.quantity > 0 ? (
//               <span className="text-green-500 text-sm">In Stock</span>
//             ) : (
//               <span className="text-red-500 text-sm">Out of Stock</span>
//             )}
//           </div>
//         </div>
//       </Link>
//     </div>
//   );
// };

// export default ProductCard;