import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Plus } from "lucide-react";
import { useState } from "react";
import FinancialRecordModal from "@/components/modals/financial-record-modal";

export default function FinancialRecords() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-neutral-20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Financial Records</h2>
            <p className="text-sm text-neutral-50">Track income and expenses</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-neutral-50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Financial Records</h3>
          <p className="text-neutral-50 mb-6">
            Detailed financial records management is coming soon.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Record
          </Button>
        </div>
      </div>

      <FinancialRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
