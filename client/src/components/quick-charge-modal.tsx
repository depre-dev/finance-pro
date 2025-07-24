import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

const quickChargeSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().optional().default("General"),
});

type QuickChargeData = z.infer<typeof quickChargeSchema>;

interface QuickChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export default function QuickChargeModal({ isOpen, onClose, project }: QuickChargeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<QuickChargeData>({
    resolver: zodResolver(quickChargeSchema),
    defaultValues: {
      amount: "",
      description: "",
      category: "General",
    },
  });

  const createChargeMutation = useMutation({
    mutationFn: (data: QuickChargeData) => 
      apiRequest("/api/charge-history", "POST", {
        projectId: project.id,
        amount: data.amount,
        description: data.description,
        category: data.category,
        date: new Date(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/charge-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Expense Added",
        description: `Added CHF ${form.getValues("amount")} to ${project.name}`,
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add expense",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(Number(amount));
  };

  const currentBudget = parseFloat(project.totalBudget || "0");
  const currentSpent = parseFloat(project.actualCost || "0");
  const remainingBudget = currentBudget - currentSpent;
  const enteredAmount = parseFloat(form.watch("amount") || "0");
  const newRemaining = remainingBudget - enteredAmount;

  const onSubmit = (data: QuickChargeData) => {
    createChargeMutation.mutate(data);
  };

  const commonExpenses = [
    { label: "Software License", amount: "500", category: "Software" },
    { label: "Hardware Purchase", amount: "1000", category: "Hardware" },
    { label: "Consulting", amount: "2000", category: "Consulting" },
    { label: "Training", amount: "800", category: "Training" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Add Expense to {project.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Budget Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Budget:</span>
                <div className="font-semibold">{formatCurrency(currentBudget)}</div>
              </div>
              <div>
                <span className="text-gray-600">Current Spent:</span>
                <div className="font-semibold">{formatCurrency(currentSpent)}</div>
              </div>
              <div>
                <span className="text-gray-600">Currently Available:</span>
                <div className={`font-semibold ${remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(remainingBudget))}
                  {remainingBudget < 0 && " (Over Budget)"}
                </div>
              </div>
              {enteredAmount > 0 && (
                <div>
                  <span className="text-gray-600">After This Expense:</span>
                  <div className={`font-semibold ${newRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(Math.abs(newRemaining))}
                    {newRemaining < 0 && " (Over Budget)"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Quick Add Common Expenses</Label>
            <div className="grid grid-cols-2 gap-2">
              {commonExpenses.map((expense) => (
                <Button
                  key={expense.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.setValue("amount", expense.amount);
                    form.setValue("description", expense.label);
                    form.setValue("category", expense.category);
                  }}
                  className="text-left h-auto py-2 px-3"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-medium">{expense.label}</span>
                    <span className="text-xs text-gray-500">CHF {expense.amount}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Manual Entry Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (CHF)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register("amount")}
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => form.setValue("category", value)} defaultValue="General">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Hardware">Hardware</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Training">Training</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Adobe Creative Suite license, MacBook Pro, Security audit..."
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* Budget Warning */}
            {enteredAmount > 0 && newRemaining < 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center text-red-700">
                  <span className="text-sm font-medium">⚠️ Budget Alert</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  This expense will put the project {formatCurrency(Math.abs(newRemaining))} over budget.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createChargeMutation.isPending}
                className={newRemaining < 0 && enteredAmount > 0 ? "bg-red-600 hover:bg-red-700" : ""}
              >
                {createChargeMutation.isPending ? "Adding..." : 
                 newRemaining < 0 && enteredAmount > 0 ? "Add (Over Budget)" : "Add Expense"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}