import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Download } from "lucide-react";
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
}
export function EditableRubric({ data, scale, onUpdate, onExport }: EditableRubricProps) {
  const handleCellChange = (rowId: string, type: 'criterion' | number, value: string) => {
    const newData = data.map(row => {
      if (row.id === rowId) {
        if (type === 'criterion') return { ...row, criterion: value };
        const newLevels = [...row.levels];
        newLevels[type as number] = value;
        return { ...row, levels: newLevels };
      }
      return row;
    });
    onUpdate(newData);
  };
  const addRow = () => {
    const newRow: RubricRow = {
      id: crypto.randomUUID(),
      criterion: 'New Criterion',
      levels: Array(scale).fill('Level description...')
    };
    onUpdate([...data, newRow]);
  };
  const removeRow = (id: string) => {
    onUpdate(data.filter(r => r.id !== id));
  };
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
      <div className="rounded-xl border-2 border-primary/20 bg-white shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="w-[180px] font-bold text-primary">Criterion</TableHead>
              {Array.from({ length: scale }).map((_, i) => (
                <TableHead key={i} className="font-bold text-primary text-center">
                  Level {scale - i}
                </TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/30">
                <TableCell className="align-top font-medium">
                  <Textarea 
                    value={row.criterion}
                    onChange={(e) => handleCellChange(row.id, 'criterion', e.target.value)}
                    className="border-none focus-visible:ring-1 resize-none bg-transparent"
                  />
                </TableCell>
                {row.levels.map((level, idx) => (
                  <TableCell key={idx} className="align-top">
                    <Textarea 
                      value={level}
                      onChange={(e) => handleCellChange(row.id, idx, e.target.value)}
                      className="border-none focus-visible:ring-1 resize-none bg-transparent min-h-[80px]"
                    />
                  </TableCell>
                ))}
                <TableCell className="align-top">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeRow(row.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={addRow} className="border-sketchy hover:bg-primary/5">
          <Plus className="w-4 h-4 mr-2" /> Add Criterion
        </Button>
        <Button onClick={onExport} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200">
          <Download className="w-4 h-4 mr-2" /> Export Professional PDF
        </Button>
      </div>
    </div>
  );
}