import React, { useCallback, useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Download, Save, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
export interface RubricRow {
  id: string;
  criterion: string;
  levels: string[];
}
interface AutoSizeTextareaProps extends React.ComponentProps<typeof Textarea> {
  value: string;
}
const AutoSizeTextarea = ({ value, className, ...props }: AutoSizeTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const currentHeight = textarea.style.height;
      textarea.style.height = "auto";
      const newHeight = `${textarea.scrollHeight}px`;
      // Only update if height actually changed to prevent jitter
      if (currentHeight !== newHeight) {
        textarea.style.height = newHeight;
      } else {
        textarea.style.height = currentHeight;
      }
    }
  }, []);
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);
  return (
    <Textarea
      ref={textareaRef}
      value={value}
      className={cn(
        "border-transparent focus:border-primary/20 focus-visible:ring-1 resize-none bg-transparent overflow-hidden transition-all duration-100",
        className
      )}
      {...props}
    />
  );
};
interface EditableRubricProps {
  data: RubricRow[];
  scale: number;
  onUpdate: (data: RubricRow[]) => void;
  onExport: () => void;
  onExportCsv?: () => void;
  onSave?: () => void;
}
export function EditableRubric({ data, scale, onUpdate, onExport, onExportCsv, onSave }: EditableRubricProps) {
  const handleCellChange = useCallback((rowId: string, type: 'criterion' | number, value: string) => {
    onUpdate(data.map(row => {
      if (row.id === rowId) {
        if (type === 'criterion') return { ...row, criterion: value };
        const newLevels = [...row.levels];
        newLevels[type as number] = value;
        return { ...row, levels: newLevels };
      }
      return row;
    }));
  }, [data, onUpdate]);
  const addRow = useCallback(() => {
    const newRow: RubricRow = {
      id: crypto.randomUUID(),
      criterion: '',
      levels: Array(scale).fill('')
    };
    onUpdate([...data, newRow]);
  }, [data, scale, onUpdate]);
  const removeRow = useCallback((id: string) => {
    onUpdate(data.filter(r => r.id !== id));
  }, [data, onUpdate]);
  return (
    <div className="space-y-6">
      <div className="relative rounded-xl border-2 border-primary/20 bg-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-primary/5">
              <TableRow>
                <TableHead className="w-[220px] font-bold text-primary py-4">Criterion</TableHead>
                {Array.from({ length: scale }).map((_, i) => (
                  <TableHead key={`head-${i}`} className="font-bold text-primary text-center py-4">
                    Level {scale - i}
                  </TableHead>
                ))}
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30 group transition-colors">
                  <TableCell className="align-top font-medium p-2">
                    <AutoSizeTextarea
                      aria-label={`Criterion for row ${row.id}`}
                      aria-required="true"
                      value={row.criterion}
                      onChange={(e) => handleCellChange(row.id, 'criterion', e.target.value)}
                      className="min-h-[60px] text-sm font-semibold"
                      placeholder="e.g. Critical Thinking"
                    />
                  </TableCell>
                  {row.levels.map((level, idx) => (
                    <TableCell key={`${row.id}-level-${idx}`} className="align-top p-2 border-l border-muted/50">
                      <AutoSizeTextarea
                        aria-label={`Level ${scale - idx} description for ${row.criterion || 'this criterion'}`}
                        value={level}
                        onChange={(e) => handleCellChange(row.id, idx, e.target.value)}
                        className="min-h-[100px] text-xs leading-relaxed"
                        placeholder={`Describe Level ${scale - idx}...`}
                      />
                    </TableCell>
                  ))}
                  <TableCell className="align-top p-2">
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(row.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        aria-label="Delete criterion row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Button
          variant="outline"
          onClick={addRow}
          className="border-2 border-primary/20 hover:bg-primary/5 w-full sm:w-auto font-bold h-11"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Criterion
        </Button>
        <div className="flex flex-wrap justify-center gap-4 w-full sm:w-auto">
          {onSave && (
            <Button
              variant="outline"
              onClick={onSave}
              className="border-2 border-primary/20 text-primary hover:bg-primary/5 h-11 px-6 font-bold"
            >
              <Save className="w-4 h-4 mr-2" /> Save Workspace
            </Button>
          )}
          <Button
            onClick={onExport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 h-11 px-8 font-bold"
          >
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          {onExportCsv && (
            <Button
              onClick={onExportCsv}
              className="bg-primary hover:bg-primary/90 text-white shadow-lg h-11 px-8 font-bold"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}