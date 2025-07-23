import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Plus } from "lucide-react";

export default function Reports() {
  return (
    <>
      <header className="bg-white border-b border-neutral-20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Reports</h2>
            <p className="text-sm text-neutral-50">Generate financial reports and analytics</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-neutral-50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Financial Reports</h3>
          <p className="text-neutral-50 mb-6">
            Comprehensive reporting features are coming soon. Generate detailed financial reports and analytics.
          </p>
        </div>
      </div>
    </>
  );
}
