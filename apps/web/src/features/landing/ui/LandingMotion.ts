import type { Variants } from "framer-motion";

type RevealOptions = {
  delay?: number;
  y?: number;
  duration?: number;
};

export function fadeUpReveal(options: RevealOptions = {}) {
  const y = options.y ?? 28;
  const duration = options.duration ?? 0.72;
  const delay = options.delay ?? 0;

  return {
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration, ease: [0.22, 1, 0.36, 1], delay }
  };
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.62,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};
