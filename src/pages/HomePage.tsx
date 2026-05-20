import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileText, ChevronLeft, Info } from 'lucide-react';
import { RubricForm, RubricFormData } from '@/components/RubricForm';
import { EditableRubric, RubricRow } from '@/components/EditableRubric';
import { SketchyUnderline, Handwriting } from '@/components/IllustrativeBranding';
import { RubricLibrary } from '@/components/RubricLibrary';
import { Footer } from '@/components/layout/Footer';
import { chatService } from '@/lib/chat';
import { exportRubricToPDF } from '@/lib/pdf-export';
import { exportRubricToCSV } from '@/lib/csv-export';
import { useRubricStore, SavedRubric } from '@/lib/store';
import { Toaster, toast } from 'sonner';
export function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'form' | 'loading' | 'result'>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [rubricData, setRubricData] = useState<RubricRow[]>([]);
  const [formData, setFormData] = useState<RubricFormData | null>(null);
  const saveRubric = useRubricStore(s => s.saveRubric);
  const clearCurrent = useRubricStore(s => s.clearCurrent);
  useEffect(() => {
    setMounted(true);
  }, []);
  const handleGenerate = useCallback(async (data: RubricFormData) => {
    setFormData(data);
    setView('loading');
    setIsGenerating(true);
    const teacherContext = data.teacherName ? `Teacher: ${data.teacherName}. ` : "";
    const detailLabels = ['concise', 'compact', 'balanced', 'expanded', 'detailed'];
    const targetWords = Math.max(10, Math.min(50, data.feedbackDetail * 10));
    const prompt = `Generate a high-school level pedagogical grading rubric for: ${data.assignmentName} in ${data.subject} for the ${data.gradeLevel} Grade level.
    ${teacherContext}Tone: ${data.tone}. Scale: ${data.scale} levels.
    Feedback Detail: ${detailLabels[data.feedbackDetail - 1]} (${data.feedbackDetail}/5). Aim for about ${targetWords} words per level description (roughly 10 to 50 words).
    Context: ${data.context}
    CRITICAL: Return ONLY a raw JSON array of objects. No preamble. No markdown code blocks.
    Example format:
    [
      {"id": "1", "criterion": "Structure", "levels": ["Expertly organized...", "Mostly organized...", "Lacks organization..."]}
    ]
    Ensure exact scale matches: each object must have "levels" array of length ${data.scale}. Ensure the vocabulary and depth are appropriate for a ${data.gradeLevel} Grade student.`;
    try {
      const response = await chatService.sendMessage(prompt, undefined, undefined, data.temperature);
      if (response.success) {
        const raw = response.data?.messages[response.data.messages.length - 1]?.content || "";
        let parsed: RubricRow[] | null = null;
        try {
          // 1st defense: bracket search
          const startIdx = raw.indexOf('[');
          const endIdx = raw.lastIndexOf(']');
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const jsonCandidate = raw.substring(startIdx, endIdx + 1);
            parsed = JSON.parse(jsonCandidate);
          } else {
            // 2nd defense: Regex for array content if brackets failed or were messy
            const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (arrayMatch) {
              parsed = JSON.parse(arrayMatch[0]);
            } else {
              // 3rd defense: cleanup markdown tags
              const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
              parsed = JSON.parse(cleaned);
            }
          }
        } catch (parseError) {
          console.error("JSON extraction failed:", raw, parseError);
        }
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          // Scale Validation: Ensure each row matches the requested scale
          const isValidScale = parsed.every(row => row.levels && row.levels.length === data.scale);
          if (!isValidScale) {
            throw new Error(`The AI generated a rubric with the wrong number of levels (requested ${data.scale}). Please try again.`);
          }
          const normalized = parsed.map((item, idx) => ({
            ...item,
            id: item.id || crypto.randomUUID() || `row-${idx}-${Date.now()}`
          }));
          setRubricData(normalized);
          setView('result');
          saveRubric(data, normalized);
        } else {
          throw new Error("I couldn't generate a valid rubric structure. Please provide more specific assignment details and try again.");
        }
      } else {
        throw new Error(response.error || "Failed to connect to the AI Architect.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed. Please check your connection and try again.";
      console.error("Generation error:", message);
      toast.error(message);
      setView('form');
    } finally {
      setIsGenerating(false);
    }
  }, [saveRubric]);
  const handleLoad = useCallback((rubric: SavedRubric) => {
    setFormData(rubric.metadata);
    setRubricData(rubric.data);
    setView('result');
  }, []);
  const handleStartNew = useCallback(() => {
    clearCurrent();
    setFormData(null);
    setRubricData([]);
    setView('form');
  }, [clearCurrent]);
  const handleSave = useCallback(() => {
    if (formData) {
      saveRubric(formData, rubricData);
      toast.success("Progress saved to LinearEd library");
    }
  }, [formData, rubricData, saveRubric]);
  const handleExport = useCallback(() => {
    if (formData) {
      exportRubricToPDF(rubricData, formData);
    }
  }, [formData, rubricData]);
  const handleExportCsv = useCallback(() => {
    if (formData) {
      exportRubricToCSV(rubricData, formData);
    }
  }, [formData, rubricData]);
  if (!mounted) return null;
  return (
    <div className="min-h-screen grid-paper flex flex-col transition-opacity duration-500">
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-40 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded rotate-3 shadow-sm">
                <FileText className="text-white w-5 h-5" />
              </div>
              <h1 className="text-2xl text-primary font-bold tracking-tight">Linear<span className="text-brand-orange">Ed</span></h1>
            </div>
            <SketchyUnderline className="h-1" />
          </div>
          <div className="flex items-center gap-4">
            <RubricLibrary onLoad={handleLoad} />
            <div className="hidden lg:block">
              <Handwriting className="text-sm text-brand-orange italic">Excellence in every expectation</Handwriting>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {view === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12 space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  Design a Rubric in <span className="italic text-brand-orange">Seconds</span>
                </h2>
                <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                  Transform assignment prompts into high-quality pedagogical roadmaps for your students.
                </p>
              </div>
              <RubricForm onSubmit={handleGenerate} isLoading={isGenerating} />
            </motion.div>
          )}
          {view === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 space-y-8"
            >
              <div className="relative">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse w-7 h-7" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">The AI Architect is at work...</h3>
                <p className="text-muted-foreground italic">Aligning criteria with your classroom goals</p>
              </div>
            </motion.div>
          )}
          {view === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <button
                  onClick={handleStartNew}
                  className="flex items-center gap-2 text-primary font-bold hover:underline group"
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                  Back to Form
                </button>
                <div className="text-left sm:text-right">
                  <h2 className="text-2xl md:text-3xl font-bold">{formData?.assignmentName}</h2>
                  <p className="text-muted-foreground">
                    {formData?.subject} • {formData?.gradeLevel} Grade
                    {formData?.teacherName && ` • ${formData.teacherName}`}
                  </p>
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl flex gap-3 text-primary text-sm shadow-sm">
                <div className="shrink-0 pt-0.5">
                  <Info className="w-5 h-5" />
                </div>
                <p>
                  <strong>LinearEd Workspace:</strong> Review and refine each cell. 
                  Changes are locally cached and saved to your library when you click 
                  "Save Workspace".
                </p>
              </div>
              <EditableRubric
                data={rubricData}
                scale={formData?.scale || 4}
                onUpdate={setRubricData}
                onExport={handleExport}
                onExportCsv={handleExportCsv}
                onSave={handleSave}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}