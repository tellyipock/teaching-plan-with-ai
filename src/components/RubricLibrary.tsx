import React, { useState, useMemo } from 'react';
import { useRubricStore, SavedRubric } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Library, Trash2, FileText, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
interface RubricLibraryProps {
  onLoad: (rubric: SavedRubric) => void;
}
export function RubricLibrary({ onLoad }: RubricLibraryProps) {
  const savedRubrics = useRubricStore(useShallow(s => s.savedRubrics));
  const deleteRubric = useRubricStore(s => s.deleteRubric);
  const loadRubric = useRubricStore(s => s.loadRubric);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const filtered = useMemo(() => {
    return savedRubrics.filter((r) =>
      r.metadata.assignmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.metadata.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [savedRubrics, searchTerm]);
  const handleRubricSelect = (rubric: SavedRubric) => {
    // Synchronize currentRubricId in store before firing onLoad callback
    loadRubric(rubric.id);
    onLoad(rubric);
    setIsOpen(false);
  };
  const confirmDelete = () => {
    if (deleteId) {
      deleteRubric(deleteId);
      setDeleteId(null);
    }
  };
  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 border-sketchy bg-white/50 backdrop-blur-sm hover:bg-primary/5">
            <Library className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline font-bold">My LinearEd Library</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md bg-background grid-paper border-l border-primary/10">
          <SheetHeader className="pb-6">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <Library className="text-primary" /> LinearEd Library
            </SheetTitle>
            <SheetDescription className="text-muted-foreground text-sm">
              Manage your saved rubrics and continue working on your assignments.
            </SheetDescription>
            <div className="relative pt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by assignment or subject..."
                className="pl-9 bg-white border-primary/20 focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-180px)] pr-4">
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground font-medium">No rubrics found.</p>
                {searchTerm && <p className="text-xs mt-1">Refine your search keywords.</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((rubric) => (
                  <div
                    key={rubric.id}
                    className="group relative bg-white p-4 rounded-xl border border-primary/10 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => handleRubricSelect(rubric)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg leading-tight pr-8 text-foreground group-hover:text-primary transition-colors">
                        {rubric.metadata.assignmentName}
                      </h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(rubric.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="bg-primary/5 px-2 py-0.5 rounded-full text-primary font-bold">
                        {rubric.metadata.subject}
                      </span>
                      <span className="bg-muted px-2 py-0.5 rounded-full">
                        {rubric.metadata.gradeLevel} Grade
                      </span>
                      <div className="flex items-center gap-1 ml-auto">
                        <Calendar className="w-3 h-3" />
                        {format(rubric.updatedAt, 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rubric?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this rubric from your library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}