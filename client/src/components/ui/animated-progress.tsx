import { motion, useSpring, useTransform } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AnimatedProgressProps {
  value: number;
  className?: string;
  showValue?: boolean;
  animated?: boolean;
  color?: "default" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  label?: string;
}

export default function AnimatedProgress({
  value,
  className,
  showValue = false,
  animated = true,
  color = "default",
  size = "md",
  label
}: AnimatedProgressProps) {
  const [mounted, setMounted] = useState(false);
  
  // Animated value for smooth transitions
  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.001
  });
  
  const animatedValue = useTransform(springValue, [0, 100], [0, 100]);

  useEffect(() => {
    setMounted(true);
    if (animated) {
      springValue.set(value);
    }
  }, [value, animated, springValue]);

  const colorClasses = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500"
  };

  const sizeClasses = {
    sm: "h-2",
    md: "h-3", 
    lg: "h-4"
  };

  if (!mounted) {
    return (
      <div className={cn("w-full", className)}>
        <Progress value={0} className={cn(sizeClasses[size])} />
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="font-medium">{label}</span>}
          {showValue && (
            <motion.span
              className="text-muted-foreground font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {animated ? (
                <motion.span>
                  {useTransform(animatedValue, (v) => `${Math.round(v)}%`)}
                </motion.span>
              ) : (
                `${Math.round(value)}%`
              )}
            </motion.span>
          )}
        </div>
      )}
      
      <div className={cn("relative bg-secondary rounded-full overflow-hidden", sizeClasses[size])}>
        {/* Background glow effect for warning/danger states */}
        {(color === "warning" || color === "danger") && value > 80 && (
          <motion.div
            className={cn(
              "absolute inset-0 opacity-20",
              color === "warning" ? "bg-yellow-300" : "bg-red-300"
            )}
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        
        <motion.div
          className={cn(
            "h-full rounded-full transition-colors duration-300",
            colorClasses[color]
          )}
          initial={{ width: "0%" }}
          animate={{ 
            width: animated ? undefined : `${value}%`
          }}
          style={{
            width: animated ? useTransform(animatedValue, (v) => `${v}%`) : undefined
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay: 1
            }}
          />
        </motion.div>
        
        {/* Pulse effect for completion */}
        {value >= 100 && (
          <motion.div
            className="absolute inset-0 bg-green-400/30 rounded-full"
            initial={{ scale: 1, opacity: 0 }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 1,
              ease: "easeOut"
            }}
          />
        )}
      </div>
    </div>
  );
}