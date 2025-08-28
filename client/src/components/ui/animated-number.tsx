import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  format?: "currency" | "number" | "percentage";
  locale?: string;
  currency?: string;
}

export default function AnimatedNumber({
  value,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1,
  format = "number",
  locale = "de-CH",
  currency = "CHF"
}: AnimatedNumberProps) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.001
  });

  const display = useTransform(spring, (current) => {
    let formatted: string;
    
    switch (format) {
      case "currency":
        formatted = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(current);
        break;
      case "percentage":
        formatted = new Intl.NumberFormat(locale, {
          style: 'percent',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(current / 100);
        break;
      default:
        formatted = new Intl.NumberFormat(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(current);
    }
    
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      spring.set(value);
    }, 100);

    return () => clearTimeout(timeout);
  }, [spring, value]);

  return (
    <motion.span
      className={cn("font-mono", className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {display}
    </motion.span>
  );
}