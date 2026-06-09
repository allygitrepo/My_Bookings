import React from 'react';
import { motion } from 'framer-motion';

const variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/**
 * PageTransition — wraps each page in a subtle fade-up entrance animation.
 */
const PageTransition = ({ children }) => (
    <motion.div
        initial="hidden"
        animate="visible"
        variants={variants}
        style={{ width: '100%', display: 'block' }}
    >
        {children}
    </motion.div>
);

export default PageTransition;
