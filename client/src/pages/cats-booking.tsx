import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Filter,
  Calendar,
  Code,
  Building2,
  ExternalLink,
  Download,
  FileSpreadsheet
} from "lucide-react";
import type { Project } from "@shared/schema";
import RebookingExportModal from "@/components/modals/rebooking-export-modal";

interface ExcelProjectData {
  "Target Release Group"?: string;
  "WBS"?: string;
  "Business Unit"?: string;
  "Project ID"?: string;
  "Total Budget (CHF)"?: string;
  "Total PDs"?: string;
  "Total External PDs"?: string;
  [key: string]: any;
}

export default function CATSBooking() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRelease, setSelectedRelease] = useState<string>("all");
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>("all");
  const [rebookingModalOpen, setRebookingModalOpen] = useState(false);

  // Fetch all projects to get the Excel project names
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch Excel project names
  const { data: excelProjectNames = [] } = useQuery<string[]>({
    queryKey: ["/api/excel-project-names"],
  });

  // Fetch all Excel project data for each project name
  const excelDataQueries = useQuery({
    queryKey: ["/api/all-excel-data"],
    queryFn: async () => {
      const allData: Array<ExcelProjectData & { projectName: string }> = [];
      
      for (const projectName of excelProjectNames) {
        try {
          const response = await fetch(`/api/excel-project-data/${encodeURIComponent(projectName)}`);
          if (response.ok) {
            const data = await response.json();
            allData.push({
              ...data,
              projectName
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch data for ${projectName}:`, error);
        }
      }
      
      return allData;
    },
    enabled: excelProjectNames.length > 0,
  });

  const allExcelData = excelDataQueries.data || [];

  // Get unique releases and business units for filters
  const uniqueReleases = Array.from(new Set(
    allExcelData
      .map(item => item["Target Release Group"])
      .filter(Boolean)
  )).sort();

  const uniqueBusinessUnits = Array.from(new Set(
    allExcelData
      .map(item => item["Business Unit"])
      .filter(Boolean)
  )).sort();

  // Filter the data based on search term, release, and business unit
  const filteredData = allExcelData.filter(item => {
    const matchesSearch = !searchTerm || 
      (item.WBS?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item["Project ID"]?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item["Business Unit"]?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRelease = selectedRelease === "all" || 
      item["Target Release Group"] === selectedRelease;

    const matchesBusinessUnit = selectedBusinessUnit === "all" || 
      item["Business Unit"] === selectedBusinessUnit;

    return matchesSearch && matchesRelease && matchesBusinessUnit && item.WBS;
  });

  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return "N/A";
    const num = parseFloat(amount.toString().replace(/[^\d.-]/g, ''));
    if (isNaN(num)) return "N/A";
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(num);
  };

  const handleExport = () => {
    const csvHeaders = ['WBS', 'Project Name', 'Project ID', 'Business Unit', 'Target Release', 'Total Budget', 'Total PDs', 'External PDs'];
    const csvRows = [csvHeaders.join(',')];
    
    filteredData.forEach(item => {
      const row = [
        `"${item.WBS || ''}"`,
        `"${item.projectName || ''}"`,
        `"${item["Project ID"] || ''}"`,
        `"${item["Business Unit"] || ''}"`,
        `"${item["Target Release Group"] || ''}"`,
        `"${item["Total Budget (CHF)"] || ''}"`,
        `"${item["Total PDs"] || ''}"`,
        `"${item["Total External PDs"] || ''}"`,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cats-booking-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CATS Booking</h2>
          <p className="text-muted-foreground">
            Search and filter WBS codes across all project releases
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" disabled={filteredData.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export Results
          </Button>
          <Button onClick={() => setRebookingModalOpen(true)} disabled={projects.length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Re-booking Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total WBS Entries</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allExcelData.filter(item => item.WBS).length}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredData.length}</div>
            <p className="text-xs text-muted-foreground">
              Matching your criteria
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Releases</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueReleases.length}</div>
            <p className="text-xs text-muted-foreground">
              Available releases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Units</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueBusinessUnits.length}</div>
            <p className="text-xs text-muted-foreground">
              Different units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>
            Find specific WBS codes by project name, ID, or business unit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search WBS, project name, or project ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedRelease} onValueChange={setSelectedRelease}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by Release" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Releases</SelectItem>
                {uniqueReleases.map(release => (
                  <SelectItem key={release} value={release!}>
                    {release}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedBusinessUnit} onValueChange={setSelectedBusinessUnit}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by Business Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Business Units</SelectItem>
                {uniqueBusinessUnits.map(unit => (
                  <SelectItem key={unit} value={unit!}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>WBS Results</CardTitle>
          <CardDescription>
            {filteredData.length > 0 
              ? `Showing ${filteredData.length} WBS entries`
              : "No WBS entries match your search criteria"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {excelDataQueries.isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-lg">Loading WBS data...</div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Code className="mx-auto h-8 w-8 mb-2" />
              <p>No WBS codes found matching your criteria</p>
              <p className="text-sm">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>WBS</TableHead>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Project ID</TableHead>
                    <TableHead>Business Unit</TableHead>
                    <TableHead>Target Release</TableHead>
                    <TableHead>Total Budget</TableHead>
                    <TableHead>Total PDs</TableHead>
                    <TableHead>External PDs</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => {
                    const isLinkedProject = projects.some(p => p.name === item.projectName);
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-mono font-medium">
                          {item.WBS}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="truncate max-w-[200px]" title={item.projectName}>
                              {item.projectName}
                            </span>
                            {isLinkedProject && (
                              <ExternalLink className="h-3 w-3 text-blue-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item["Project ID"] || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item["Business Unit"] || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {item["Target Release Group"] || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(item["Total Budget (CHF)"])}
                        </TableCell>
                        <TableCell>{item["Total PDs"] || "N/A"}</TableCell>
                        <TableCell>{item["Total External PDs"] || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={isLinkedProject ? "default" : "outline"}>
                            {isLinkedProject ? "Active" : "Not Linked"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Re-booking Export Modal */}
      <RebookingExportModal
        open={rebookingModalOpen}
        onOpenChange={setRebookingModalOpen}
      />
    </div>
  );
}