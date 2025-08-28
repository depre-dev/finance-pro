import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, X, Folder, Receipt, Calculator, FileText } from 'lucide-react';
import type { Project } from '@shared/schema';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'project' | 'expense' | 'budget' | 'record';
  icon: React.ComponentType<any>;
  action: () => void;
}

interface EnhancedSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
}

export default function EnhancedSearch({ 
  onResultSelect, 
  placeholder = "Search projects, expenses, and more...",
  showFilters = true 
}: EnhancedSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const filters = [
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: Calculator },
    { id: 'records', label: 'Records', icon: FileText },
  ];

  // Generate search results based on current data
  const searchResults: SearchResult[] = [
    ...(projects || [])
      .filter(project => 
        (selectedFilters.length === 0 || selectedFilters.includes('projects')) &&
        (project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         project.businessUnit?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .map(project => ({
        id: `project-${project.id}`,
        title: project.name,
        subtitle: `Business Unit: ${project.businessUnit || 'N/A'}`,
        type: 'project' as const,
        icon: Folder,
        action: () => {
          // Navigate to project or open project modal
          console.log('Navigate to project:', project.id);
          setOpen(false);
        }
      })),
    
    // Add more result types here as needed
    ...(searchTerm.length > 0 ? [
      {
        id: 'create-project',
        title: `Create project "${searchTerm}"`,
        subtitle: 'Create a new project with this name',
        type: 'project' as const,
        icon: Folder,
        action: () => {
          console.log('Create project with name:', searchTerm);
          setOpen(false);
        }
      }
    ] : [])
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full max-w-2xl">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start text-left font-normal"
          >
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <span className="flex-1 truncate">
              {searchTerm || placeholder}
            </span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0" side="bottom" align="start">
          <Command>
            <CommandInput
              placeholder={placeholder}
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            
            {showFilters && (
              <div className="border-b p-2">
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => {
                    const Icon = filter.icon;
                    const isSelected = selectedFilters.includes(filter.id);
                    return (
                      <Badge
                        key={filter.id}
                        variant={isSelected ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => toggleFilter(filter.id)}
                      >
                        <Icon className="mr-1 h-3 w-3" />
                        {filter.label}
                      </Badge>
                    );
                  })}
                  {selectedFilters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-6 px-2"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}

            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              
              {searchResults.length > 0 && (
                <CommandGroup heading="Results">
                  {searchResults.slice(0, 8).map((result) => {
                    const Icon = result.icon;
                    return (
                      <CommandItem
                        key={result.id}
                        value={result.title}
                        onSelect={() => {
                          result.action();
                          onResultSelect?.(result);
                        }}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">{result.title}</div>
                          {result.subtitle && (
                            <div className="text-sm text-muted-foreground">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {result.type}
                        </Badge>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {searchTerm.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Quick Actions">
                    <CommandItem onSelect={() => console.log('Create project')}>
                      <Folder className="mr-2 h-4 w-4" />
                      Create new project
                    </CommandItem>
                    <CommandItem onSelect={() => console.log('Add expense')}>
                      <Receipt className="mr-2 h-4 w-4" />
                      Add new expense
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}