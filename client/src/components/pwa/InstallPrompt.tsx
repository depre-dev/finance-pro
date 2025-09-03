import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export default function InstallPrompt() {
  const { showInstallPrompt, installPWA, dismissInstallPrompt } = usePWA();

  if (!showInstallPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 border-0 text-white shadow-2xl">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-full p-2 mt-1">
                <Smartphone className="h-5 w-5" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">
                  Install FinancePro App
                </h3>
                <p className="text-sm opacity-90 mb-3">
                  Get instant access, work offline, and receive notifications. 
                  No app store required!
                </p>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={installPWA}
                    className="bg-white text-blue-600 hover:bg-gray-100 flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Install
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={dismissInstallPrompt}
                    className="text-white hover:bg-white/20"
                  >
                    Later
                  </Button>
                </div>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={dismissInstallPrompt}
                className="text-white hover:bg-white/20 p-1 h-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}