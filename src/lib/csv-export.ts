import { RubricRow } from '@/components/EditableRubric';
import { RubricFormData } from '@/components/RubricForm';

function escapeCsvCell(value: string): string {
  const normalized = String(value ?? '');
  if (/[",\n\r]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function getHeader(scale: number): string[] {
  const base = [
    'Rubric Name',
    'Criteria Name',
    'Criteria Description',
    'Criteria Enable Range',
  ];

  for (let i = 0; i < scale; i += 1) {
    base.push('Rating Name', 'Rating Description', 'Rating Points');
  }

  return base;
}

function getRowCells(row: RubricRow, rowIndex: number, rubricName: string, scale: number): string[] {
  const cells = [
    rubricName,
    row.criterion || `Criteria ${rowIndex + 1}`,
    `${row.criterion || `Criteria ${rowIndex + 1}`} Description`,
    'false',
  ];

  for (let i = 0; i < scale; i += 1) {
    const levelDescription = row.levels[i] || '';
    const ratingNumber = i + 1;
    const points = scale - ratingNumber;
    cells.push(
      `${row.criterion || `Criteria ${rowIndex + 1}`} Rating ${ratingNumber}`,
      levelDescription,
      String(points)
    );
  }

  return cells;
}

export function exportRubricToCSV(data: RubricRow[], metadata: RubricFormData): void {
  const scale = Math.max(1, metadata.scale || 1);
  const rubricName = metadata.assignmentName?.trim() || 'Rubric 1';
  const lines: string[] = [];

  lines.push(getHeader(scale).map(escapeCsvCell).join(','));

  for (let i = 0; i < data.length; i += 1) {
    const row = data[i];
    lines.push(getRowCells(row, i, rubricName, scale).map(escapeCsvCell).join(','));
  }

  const csvContent = lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const safeName = rubricName.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 50);

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${safeName}_LinearEd_Rubric.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
