import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";

export default function ImportExport() {
  return (
    <>
      <header className="bg-white border-b border-neutral-20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Import/Export</h2>
            <p className="text-sm text-neutral-50">Import and export financial data</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Import Data</h3>
                <p className="text-neutral-50 mb-4">
                  Import financial data from CSV, Excel, or other formats.
                </p>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Download className="mx-auto h-12 w-12 text-success mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Export Data</h3>
                <p className="text-neutral-50 mb-4">
                  Export your financial data to various formats for backup or analysis.
                </p>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Export All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
