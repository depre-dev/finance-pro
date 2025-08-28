import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Edit, 
  Trash2, 
  MessageSquare, 
  Users, 
  Eye, 
  EyeOff,
  Clock,
  User
} from "lucide-react";
import type { ProjectNote } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface CollaborativeNotesProps {
  projectId: number;
  projectName: string;
}

const NOTE_COLORS = [
  { value: "yellow", label: "Yellow", bg: "bg-yellow-100", border: "border-yellow-300", text: "text-yellow-800" },
  { value: "blue", label: "Blue", bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-800" },
  { value: "green", label: "Green", bg: "bg-green-100", border: "border-green-300", text: "text-green-800" },
  { value: "pink", label: "Pink", bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-800" },
  { value: "purple", label: "Purple", bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-800" },
  { value: "orange", label: "Orange", bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-800" },
];

interface NoteFormData {
  content: string;
  authorName: string;
  color: string;
  isPrivate: boolean;
}

export default function CollaborativeNotes({ projectId, projectName }: CollaborativeNotesProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);
  const [noteForm, setNoteForm] = useState<NoteFormData>({
    content: "",
    authorName: "",
    color: "yellow",
    isPrivate: false,
  });

  // Fetch project notes
  const { data: notes = [], isLoading } = useQuery<ProjectNote[]>({
    queryKey: ["/api/projects", projectId, "notes"],
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: NoteFormData) => {
      return apiRequest("POST", `/api/projects/${projectId}/notes`, noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "notes"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, noteData }: { id: number; noteData: Partial<NoteFormData> }) => {
      return apiRequest("PUT", `/api/notes/${id}`, noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "notes"] });
      setIsDialogOpen(false);
      setEditingNote(null);
      resetForm();
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "notes"] });
    },
  });

  const resetForm = () => {
    setNoteForm({
      content: "",
      authorName: "",
      color: "yellow",
      isPrivate: false,
    });
    setEditingNote(null);
  };

  const handleSubmit = () => {
    if (!noteForm.content.trim() || !noteForm.authorName.trim()) return;

    if (editingNote) {
      updateNoteMutation.mutate({
        id: editingNote.id,
        noteData: noteForm,
      });
    } else {
      createNoteMutation.mutate(noteForm);
    }
  };

  const handleEdit = (note: ProjectNote) => {
    setEditingNote(note);
    setNoteForm({
      content: note.content,
      authorName: note.authorName,
      color: note.color || "yellow",
      isPrivate: note.isPrivate || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNoteMutation.mutate(id);
    }
  };

  const getColorStyles = (color: string) => {
    const colorConfig = NOTE_COLORS.find(c => c.value === color) || NOTE_COLORS[0];
    return colorConfig;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Team Notes</h3>
          <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Team Notes - {projectName}
          </h3>
          <p className="text-sm text-muted-foreground">
            Share updates and collaborate with your team
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingNote ? "Edit Note" : "Add New Note"}
              </DialogTitle>
              <DialogDescription>
                Share important updates or thoughts with your team
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="authorName">Your Name</Label>
                <Input
                  id="authorName"
                  placeholder="Enter your name"
                  value={noteForm.authorName}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, authorName: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="content">Note Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your note here..."
                  value={noteForm.content}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="color">Note Color</Label>
                <Select 
                  value={noteForm.color} 
                  onValueChange={(value) => setNoteForm(prev => ({ ...prev, color: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_COLORS.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded ${color.bg} ${color.border} border`}></div>
                          <span>{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPrivate"
                  checked={noteForm.isPrivate}
                  onCheckedChange={(checked) => setNoteForm(prev => ({ ...prev, isPrivate: checked }))}
                />
                <Label htmlFor="isPrivate" className="flex items-center">
                  {noteForm.isPrivate ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
                  {noteForm.isPrivate ? "Private Note" : "Team Visible"}
                </Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!noteForm.content.trim() || !noteForm.authorName.trim() || createNoteMutation.isPending || updateNoteMutation.isPending}
                >
                  {editingNote ? "Update" : "Create"} Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No team notes yet</h4>
            <p className="text-muted-foreground mb-4">
              Start collaborating by adding the first note for this project
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => {
            const colorStyles = getColorStyles(note.color || "yellow");
            return (
              <Card
                key={note.id}
                className={`${colorStyles.bg} ${colorStyles.border} border-2 transform hover:scale-105 transition-transform duration-200 shadow-lg hover:shadow-xl`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className={`h-4 w-4 ${colorStyles.text}`} />
                      <span className={`text-sm font-medium ${colorStyles.text}`}>
                        {note.authorName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {note.isPrivate && (
                        <Badge variant="secondary" className="text-xs">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Private
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 w-6 p-0 ${colorStyles.text} hover:bg-white/50`}
                        onClick={() => handleEdit(note)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 w-6 p-0 ${colorStyles.text} hover:bg-white/50`}
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className={`text-sm ${colorStyles.text} whitespace-pre-wrap`}>
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-current/20">
                    <div className={`flex items-center text-xs ${colorStyles.text}/70`}>
                      <Clock className="mr-1 h-3 w-3" />
                      {format(new Date(note.createdAt), "MMM dd, HH:mm")}
                    </div>
                    {note.updatedAt !== note.createdAt && (
                      <Badge variant="outline" className="text-xs">
                        Edited
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground pt-4 border-t">
        <Users className="h-4 w-4" />
        <span>{notes.length} team {notes.length === 1 ? "note" : "notes"}</span>
        <span>•</span>
        <span>{notes.filter(n => !n.isPrivate).length} shared</span>
        <span>•</span>
        <span>{notes.filter(n => n.isPrivate).length} private</span>
      </div>
    </div>
  );
}