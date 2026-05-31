"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();

  useEffect(() => {
    // Show button when scroll position is greater than 300px
    return scrollY.on("change", (latest) => {
      setIsVisible(latest > 300);
    });
  }, [scrollY]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover="hover"
          whileTap="tap"
          variants={{
            hover: { scale: 1.05 },
            tap: { scale: 0.95 }
          }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200/80 bg-white/80 hover:bg-zinc-50 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:hover:bg-zinc-900/90 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 shadow-lg shadow-indigo-500/5 dark:shadow-indigo-500/2 backdrop-blur-md cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 group"
          aria-label="Scroll to top"
        >
          {/* Scroll progress ring */}
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="21"
              className="stroke-zinc-200/40 dark:stroke-zinc-800/40"
              strokeWidth="2.5"
              fill="transparent"
            />
            <motion.circle
              cx="24"
              cy="24"
              r="21"
              className="stroke-indigo-600 dark:stroke-indigo-500"
              strokeWidth="2.5"
              fill="transparent"
              style={{ pathLength: scrollYProgress }}
            />
          </svg>

          {/* Icon with slight micro-movement on button hover */}
          <motion.div
            variants={{
              hover: { y: -2 },
              tap: { y: 0 }
            }}
            transition={{ type: "spring", stiffness: 400, damping: 12 }}
            className="relative z-10 flex items-center justify-center"
          >
            <ArrowUp className="h-5 w-5 stroke-[2.25]" />
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default ScrollToTop;
