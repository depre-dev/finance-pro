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
            
            <div className="space-y-4">
              {records.map((record) => {
                // Get original Excel data if available
                const originalData = record.originalData as any;
                
                return (
                  <Card key={record.id} className="border border-neutral-20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-neutral-70">
                        Record #{record.id} - {getProjectName(record.projectId)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {originalData ? (
                        // Display original Excel columns
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {originalData['Target Release'] && (
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-neutral-50 uppercase tracking-wide">
                                Target Release
                              </label>
                              <p className="text-sm font-medium">{originalData['Target Release']}</p>
                            </div>
                          )}
                          
                          {originalData['Project ID'] && (
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-neutral-50 uppercase tracking-wide">
                                Project ID
                              </label>
                              <p className="text-sm font-medium">{originalData['Project ID']}</p>
                            </div>
                          )}
                          
                          {originalData['Local Testing for Liberty Delivery (CHF)'] && (
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-neutral-50 uppercase tracking-wide">
                                Local Testing for Liberty Delivery (CHF)
                              </label>
                              <p className="text-sm font-medium text-green-600">
                                CHF {originalData['Local Testing for Liberty Delivery (CHF)']}
                              </p>
                            </div>
                          )}
                          
                          {originalData['Testing effort for Fixprice (CHF)'] && (
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-neutral-50 uppercase tracking-wide">
                                Testing effort for Fixprice (CHF)
                              </label>
                              <p className="text-sm font-medium text-blue-600">
                                CHF {originalData['Testing effort for Fixprice (CHF)']}
                              </p>
                            </div>
                          )}
                          
                          {originalData['Testing effort (CHF)'] && (
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-neutral-50 uppercase tracking-wide">
                                Testing effort (CHF)
                              </label>
                              <p className="text-sm font-medium text-purple-600">
                                CHF {originalData['Testing effort (CHF)']}
                              </p>
                            </div>
                          )}
                          
                          {originalData['Name'] && (
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-neutral-50 uppercase tracking-wide">
                                Name
                              </label>
                              <p className="text-sm font-medium">{originalData['Name']}</p>
                            </div>
                          )}
                          
                          {originalData['WBS'] && (
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-neutral-50 uppercase tracking-wide">
                                WBS
                              </label>
                              <p className="text-sm font-medium">{originalData['WBS']}</p>
                            </div>
                          )}
                          
                          {/* Show any other columns that might exist */}
                          {Object.entries(originalData).map(([key, value]) => {
                            if (!['Target Release', 'Project ID', 'Local Testing for Liberty Delivery (CHF)', 
                                  'Testing effort for Fixprice (CHF)', 'Testing effort (CHF)', 'Name', 'WBS'].includes(key) && value) {
                              return (
                                <div key={key} className="space-y-1">
                                  <label className="text-xs font-medium text-neutral-50 uppercase tracking-wide">
                                    {key}
                                  </label>
                                  <p className="text-sm">{String(value)}</p>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      ) : (
                        // Fallback to standard display if no original data
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
                          
                          <div className="col-span-full mt-3 flex items-start space-x-2">
                            <FileText className="h-4 w-4 text-neutral-50 mt-0.5" />
                            <p className="text-sm text-neutral-80">{record.description}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
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
