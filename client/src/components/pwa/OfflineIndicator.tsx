import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export default function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [showOfflineMessage, setShowOfflineMessage] = React.useState(false);
  const [showOnlineMessage, setShowOnlineMessage] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true);
      setShowOnlineMessage(false);
    } else {
      setShowOfflineMessage(false);
      if (showOfflineMessage) {
        setShowOnlineMessage(true);
        setTimeout(() => setShowOnlineMessage(false), 3000);
      }
    }
  }, [isOnline, showOfflineMessage]);

  return (
    <AnimatePresence>
      {(showOfflineMessage || showOnlineMessage) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium ${
            !isOnline 
              ? 'bg-red-500 text-white' 
              : 'bg-green-500 text-white'
          }`}
        >
          {!isOnline ? (
            <>
              <WifiOff className="h-4 w-4" />
              You're offline - some features may be limited
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4" />
              Back online - syncing data...
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}