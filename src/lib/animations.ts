import { Variants } from "framer-motion";

// Opacity 0 -> 1
export const FADE_IN: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// y:20, opacity:0 -> y:0, opacity:1
export const SLIDE_UP: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  exit: {
    y: 20,
    opacity: 0,
    transition: { duration: 0.3, ease: "easeIn" },
  }
};

export const SLIDE_DOWN: Variants = {
  hidden: { y: -20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: { duration: 0.3, ease: "easeIn" },
  }
};

// scale:0.95 opacity:0 -> scale:1 opacity:1
export const SCALE_IN: Variants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  }
};

// Container stagger
export const STAGGER_CONTAINER = (staggerChildren = 0.1): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren: 0.05,
    },
  },
});

// Page route transition
export const PAGE_TRANSITION: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: "easeOut" } 
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    filter: "blur(4px)",
    transition: { duration: 0.3, ease: "easeIn" } 
  },
};

// Item slide out layout animation (for lists)
export const LIST_ITEM_LAYOUT: Variants = {
  hidden: { opacity: 0, scale: 0.95, originY: 0 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95, height: 0, marginBottom: 0, transition: { duration: 0.3 } }
};
