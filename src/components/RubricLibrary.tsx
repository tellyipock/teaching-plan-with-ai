import React, { useState, useMemo } from 'react';
import { useRubricStore, SavedRubric } from '@/lib/store';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Library, Trash2, FileText, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
interface RubricLibraryProps {
  onLoad: (rubric: SavedRubric) => void;
}
export function RubricLibrary({ onLoad }: RubricLibraryProps) {
  const savedRubrics = useRubricStore(s => s.savedRubrics);
  const deleteRubric = useRubricStore(s => s.deleteRubric);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const filtered = useMemo(() => {
    return savedRubrics.filter((r) =>
      r.metadata.assignmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.metadata.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [savedRubrics, searchTerm]);
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-sketchy bg-white/50 backdrop-blur-sm">
          <Library className="w-4 h-4" />
          <span className="hidden sm:inline">My Library</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-background grid-paper">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <Library className="text-primary" /> Rubric Library
          </SheetTitle>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              className="pl-9 bg-white border-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-180px)] pr-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No rubrics found.</p>
              {searchTerm && <p className="text-xs">Try a different search term.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((rubric) => (
                <div
                  key={rubric.id}
                  className="group relative bg-white p-4 rounded-xl border border-primary/10 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => {
                    onLoad(rubric);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg leading-tight pr-8">{rubric.metadata.assignmentName}</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this rubric?')) {
                          deleteRubric(rubric.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="bg-primary/5 px-2 py-0.5 rounded-full text-primary font-medium">
                      {rubric.metadata.subject}
                    </span>
                    <div className="flex items-center gap-1">
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
  );
}