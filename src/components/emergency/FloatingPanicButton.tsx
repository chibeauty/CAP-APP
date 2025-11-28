import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export function FloatingPanicButton() {
  const [isPressed, setIsPressed] = useState(false);
  const navigate = useNavigate();

  const handlePress = () => {
    navigate('/emergency');
  };

  return (
    <motion.button
      onTapStart={() => setIsPressed(true)}
      onTapEnd={() => setIsPressed(false)}
      onTap={handlePress}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-16 h-16 md:w-20 md:h-20 bg-accent hover:bg-accent-dark rounded-full shadow-lg flex items-center justify-center text-white focus:outline-none focus:ring-4 focus:ring-accent/50 transition-colors"
      aria-label="Emergency panic button"
    >
      <FaExclamationTriangle className="w-8 h-8 md:w-10 md:h-10" />
      {isPressed && (
        <motion.div
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          className="absolute inset-0 bg-accent rounded-full"
        />
      )}
    </motion.button>
  );
}

