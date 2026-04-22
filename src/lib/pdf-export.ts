import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RubricRow } from '@/components/EditableRubric';
import { RubricFormData } from '@/components/RubricForm';
export const exportRubricToPDF = (data: RubricRow[], metadata: RubricFormData) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  // Header
  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229); // Brand Indigo
  doc.text(metadata.assignmentName, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Subject: ${metadata.subject} | Grade: ${metadata.gradeLevel} | Scale: ${metadata.scale}-pt`, 14, 28);
  const headers = [['Criterion', ...Array.from({ length: metadata.scale }, (_, i) => `Level ${metadata.scale - i}`)]];
  const body = data.map(row => [
    row.criterion,
    ...row.levels
  ]);
  autoTable(doc, {
    startY: 35,
    head: headers,
    body: body,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 5,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 }
    }
  });
  doc.save(`${metadata.assignmentName.replace(/\s+/g, '_')}_Rubric.pdf`);
};