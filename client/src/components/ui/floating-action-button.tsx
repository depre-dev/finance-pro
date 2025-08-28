import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ComponentType<any>;
  className?: string;
  children?: React.ReactNode;
  expanded?: boolean;
  actions?: Array<{
    icon: React.ComponentType<any>;
    label: string;
    onClick: () => void;
    color?: string;
  }>;
}

export default function FloatingActionButton({
  onClick,
  icon: Icon = Plus,
  className,
  children,
  expanded = false,
  actions = []
}: FloatingActionButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {expanded && actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-16 right-0 space-y-3"
          >
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, x: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    x: 0,
                    transition: { delay: index * 0.1 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 20, 
                    x: 20,
                    transition: { delay: (actions.length - index - 1) * 0.05 }
                  }}
                  className="flex items-center gap-3"
                >
                  <motion.span
                    className="bg-background border rounded-lg px-3 py-2 text-sm font-medium shadow-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    {action.label}
                  </motion.span>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-full shadow-lg",
                        action.color || "bg-primary hover:bg-primary/90"
                      )}
                      onClick={action.onClick}
                    >
                      <ActionIcon className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={expanded ? { rotate: 45 } : { rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Button
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90",
            "relative overflow-hidden",
            className
          )}
          onClick={onClick}
        >
          <motion.div
            animate={{ rotate: expanded ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Icon className="h-6 w-6" />
          </motion.div>
          
          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            whileTap={{
              scale: 2,
              opacity: [0, 0.5, 0],
              transition: { duration: 0.4 }
            }}
          />
          
          {children}
        </Button>
      </motion.div>
    </div>
  );
}