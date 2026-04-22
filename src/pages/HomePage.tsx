import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileText, ChevronLeft, Info } from 'lucide-react';
import { RubricForm, RubricFormData } from '@/components/RubricForm';
import { EditableRubric, RubricRow } from '@/components/EditableRubric';
import { SketchyUnderline, Handwriting } from '@/components/IllustrativeBranding';
import { RubricLibrary } from '@/components/RubricLibrary';
import { Footer } from '@/components/layout/Footer';
import { chatService } from '@/lib/chat';
import { exportRubricToPDF } from '@/lib/pdf-export';
import { useRubricStore, SavedRubric } from '@/lib/store';
import { Toaster, toast } from 'sonner';
export function HomePage() {
  const [view, setView] = useState<'form' | 'loading' | 'result'>('form');
  const [rubricData, setRubricData] = useState<RubricRow[]>([]);
  const [formData, setFormData] = useState<RubricFormData | null>(null);
  // Zustand selectors - Primitives only
  const saveRubric = useRubricStore(s => s.saveRubric);
  const clearCurrent = useRubricStore(s => s.clearCurrent);
  const handleGenerate = useCallback(async (data: RubricFormData) => {
    setFormData(data);
    setView('loading');
    const teacherContext = data.teacherName ? `Teacher: ${data.teacherName}. ` : "";
    const prompt = `Generate a structured grading rubric for: ${data.assignmentName} in ${data.subject} (${data.gradeLevel}).
    ${teacherContext}Tone: ${data.tone}. Scale: ${data.scale} levels.
    Context: ${data.context}
    CRITICAL: Return ONLY a raw JSON array of objects. No preamble. No markdown code blocks.
    Example format:
    [
      {"id": "1", "criterion": "Structure", "levels": ["Expertly organized...", "Mostly organized...", "Lacks organization..."]}
    ]
    Ensure exact scale matches: each object must have "levels" array of length ${data.scale}.`;
    try {
      const response = await chatService.sendMessage(prompt);
      if (response.success) {
        const raw = response.data?.messages[response.data.messages.length - 1]?.content || "";
        const match = raw.match(/\[.*\]/s);
        if (match) {
          const parsed = JSON.parse(match[0]);
          setRubricData(parsed);
          setView('result');
          saveRubric(data, parsed);
        } else {
          throw new Error("Invalid format received");
        }
      }
    } catch (err) {
      console.error("Generation error:", err);
      toast.error("Generation failed. Please check your instructions and try again.");
      setView('form');
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
      toast.success("Changes saved to your library");
    }
  }, [formData, rubricData, saveRubric]);
  const handleExport = useCallback(() => {
    if (formData) {
      exportRubricToPDF(rubricData, formData);
    }
  }, [formData, rubricData]);
  return (
    <div className="min-h-screen grid-paper flex flex-col">
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-40 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded rotate-3 shadow-sm">
                <FileText className="text-white w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Linear<span className="text-primary">Ed</span></h1>
            </div>
            <SketchyUnderline className="h-1" />
          </div>
          <div className="flex items-center gap-4">
            <RubricLibrary onLoad={handleLoad} />
            <div className="hidden lg:block">
              <Handwriting className="text-sm">Teaching made smarter</Handwriting>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {view === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12 space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">Create a Rubric in <span className="italic text-primary">Seconds</span></h2>
                <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                  Transform assignment descriptions into professional pedagogical roadmaps instantly.
                </p>
              </div>
              <RubricForm onSubmit={handleGenerate} isLoading={false} />
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
                <h3 className="text-2xl font-bold">Crafting your rubric...</h3>
                <p className="text-muted-foreground italic">Designing clear expectations for your students</p>
              </div>
            </motion.div>
          )}
          {view === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <button
                  onClick={handleStartNew}
                  className="flex items-center gap-2 text-primary font-bold hover:underline group"
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Start New Assignment
                </button>
                <div className="text-left sm:text-right">
                  <h2 className="text-2xl md:text-3xl font-bold">{formData?.assignmentName}</h2>
                  <p className="text-muted-foreground">
                    {formData?.subject} • {formData?.gradeLevel}
                    {formData?.teacherName && ` • ${formData.teacherName}`}
                  </p>
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl flex gap-3 text-primary text-sm shadow-sm">
                <Info className="w-5 h-5 shrink-0" />
                <p><strong>Educator Workspace:</strong> Refine individual cells to perfectly match your classroom's needs. Your changes are saved to your library automatically when you click "Save Changes".</p>
              </div>
              <EditableRubric
                data={rubricData}
                scale={formData?.scale || 4}
                onUpdate={setRubricData}
                onExport={handleExport}
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