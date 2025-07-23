import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { 
  Plus, 
  Search, 
  Folder, 
  Edit,
  Eye,
  Trash2
} from "lucide-react";
import type { Project } from "@shared/schema";
import ProjectModal from "@/components/modals/project-modal";

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Number(amount));
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'on-hold': return 'outline';
      default: return 'default';
    }
  };

  return (
    <>
      <header className="bg-white border-b border-neutral-20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Projects</h2>
            <p className="text-sm text-neutral-50">Manage your financial projects</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-50 h-4 w-4" />
            </div>
            <Button onClick={() => setIsProjectModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <Skeleton className="w-10 h-10 rounded-lg mr-3" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-3 w-12 mb-1" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="mx-auto h-12 w-12 text-neutral-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
            <p className="text-neutral-50 mb-6">
              {searchTerm ? "No projects match your search criteria." : "Create your first project to get started."}
            </p>
            <Button onClick={() => setIsProjectModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                        <Folder className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{project.name}</h3>
                        <p className="text-sm text-neutral-50">{project.client || "No client"}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-neutral-50 mb-4 line-clamp-2">
                    {project.description || "No description"}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-neutral-50 mb-1">Budget</p>
                      <p className="font-semibold">{formatCurrency(project.totalBudget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-50 mb-1">Start Date</p>
                      <p className="font-semibold">
                        {project.startDate 
                          ? new Date(project.startDate).toLocaleDateString()
                          : "Not set"
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-20">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-neutral-50">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </>
  );
}
