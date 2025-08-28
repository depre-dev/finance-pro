import { motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  success?: boolean;
  pulse?: boolean;
}

export default function AnimatedButton({ 
  children, 
  className, 
  loading = false,
  success = false,
  pulse = false,
  disabled,
  ...props 
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={pulse ? {
        scale: [1, 1.05, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      } : undefined}
    >
      <Button 
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          loading && "cursor-not-allowed",
          success && "bg-green-600 hover:bg-green-700",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        <motion.div
          className="flex items-center justify-center"
          initial={false}
          animate={loading ? { opacity: 0.7 } : { opacity: 1 }}
        >
          {loading && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mr-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </motion.div>
          )}
          
          {success && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="mr-2"
            >
              ✓
            </motion.div>
          )}
          
          <motion.span
            layout
            className={cn(loading && "opacity-70")}
          >
            {children}
          </motion.span>
        </motion.div>
        
        {/* Success ripple effect */}
        {success && (
          <motion.div
            className="absolute inset-0 bg-white/20"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </Button>
    </motion.div>
  );
}