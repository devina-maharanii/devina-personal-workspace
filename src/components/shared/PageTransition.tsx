"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { PAGE_TRANSITION } from "@/lib/animations";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={PAGE_TRANSITION}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="flex flex-col flex-1 h-full w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
