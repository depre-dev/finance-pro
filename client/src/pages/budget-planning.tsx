import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Plus } from "lucide-react";

export default function BudgetPlanning() {
  return (
    <>
      <header className="bg-white border-b border-neutral-20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Budget Planning</h2>
            <p className="text-sm text-neutral-50">Plan and manage project budgets</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Budget
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-center py-12">
          <Calculator className="mx-auto h-12 w-12 text-neutral-50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Budget Planning</h3>
          <p className="text-neutral-50 mb-6">
            This feature is coming soon. You'll be able to create detailed budget plans for your projects.
          </p>
        </div>
      </div>
    </>
  );
}
