import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Plus, Calendar, DollarSign, Tag, FileText } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FinancialRecordModal from "@/components/modals/financial-record-modal";
import type { FinancialRecord, Project } from "@shared/schema";

export default function FinancialRecords() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: records, isLoading } = useQuery<FinancialRecord[]>({
    queryKey: ['/api/financial-records'],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const getProjectName = (projectId: number) => {
    return projects?.find(p => p.id === projectId)?.name || `Project ${projectId}`;
  };

  return (
    <>
      <header className="bg-white border-b border-neutral-20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Financial Records</h2>
            <p className="text-sm text-neutral-50">View your imported data and track expenses</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-neutral-50">Loading financial records...</p>
          </div>
        ) : records && records.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {records.length} Record{records.length !== 1 ? 's' : ''} Found
              </h3>
              <Badge variant="outline">{records.length} Total</Badge>
            </div>
            
            <div className="grid gap-4">
              {records.map((record) => (
                <Card key={record.id} className="border border-neutral-20">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-neutral-50" />
                        <span className="text-sm">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-neutral-50" />
                        <span className="text-sm">{record.category}</span>
                        <Badge variant={record.type === 'income' ? 'default' : 'secondary'}>
                          {record.type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-neutral-50" />
                        <span className="font-medium">${record.amount}</span>
                      </div>
                      
                      <div className="text-sm text-neutral-50">
                        {getProjectName(record.projectId)}
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-start space-x-2">
                      <FileText className="h-4 w-4 text-neutral-50 mt-0.5" />
                      <p className="text-sm text-neutral-80">{record.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-neutral-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Financial Records Found</h3>
            <p className="text-neutral-50 mb-6">
              Import your Excel file or add records manually to get started.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Record
            </Button>
          </div>
        )}
      </div>

      <FinancialRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
