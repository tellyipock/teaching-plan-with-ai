import React, { useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Download, Save } from "lucide-react";
export interface RubricRow {
  id: string;
  criterion: string;
  levels: string[];
}
interface EditableRubricProps {
  data: RubricRow[];
  scale: number;
  onUpdate: (data: RubricRow[]) => void;
  onExport: () => void;
  onSave?: () => void;
}
export function EditableRubric({ data, scale, onUpdate, onExport, onSave }: EditableRubricProps) {
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
      criterion: 'New Criterion',
      levels: Array(scale).fill('Level description...')
    };
    onUpdate([...data, newRow]);
  }, [data, scale, onUpdate]);
  const removeRow = useCallback((id: string) => {
    onUpdate(data.filter(r => r.id !== id));
  }, [data, onUpdate]);
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
      <div className="relative rounded-xl border-2 border-primary/20 bg-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-primary/5">
              <TableRow>
                <TableHead className="w-[200px] font-bold text-primary">Criterion</TableHead>
                {Array.from({ length: scale }).map((_, i) => (
                  <TableHead key={`head-${i}`} className="font-bold text-primary text-center">
                    Level {scale - i}
                  </TableHead>
                ))}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30 group">
                  <TableCell className="align-top font-medium p-2">
                    <Textarea
                      value={row.criterion}
                      onChange={(e) => handleCellChange(row.id, 'criterion', e.target.value)}
                      className="border-transparent focus:border-primary/20 focus-visible:ring-1 resize-none bg-transparent min-h-[60px] text-sm"
                    />
                  </TableCell>
                  {row.levels.map((level, idx) => (
                    <TableCell key={`${row.id}-level-${idx}`} className="align-top p-2 border-l border-muted/50">
                      <Textarea
                        value={level}
                        onChange={(e) => handleCellChange(row.id, idx, e.target.value)}
                        className="border-transparent focus:border-primary/20 focus-visible:ring-1 resize-none bg-transparent min-h-[100px] text-xs leading-relaxed"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="align-top p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(row.id)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Button variant="outline" onClick={addRow} className="border-sketchy hover:bg-primary/5 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Add New Criterion
        </Button>
        <div className="flex flex-wrap justify-center gap-4 w-full sm:w-auto">
          {onSave && (
            <Button
              variant="outline"
              onClick={onSave}
              className="border-primary/20 text-primary hover:bg-primary/5"
            >
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          )}
          <Button onClick={onExport} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200">
            <Download className="w-4 h-4 mr-2" /> Export Professional PDF
          </Button>
        </div>
      </div>
    </div>
  );
}