import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Library, FileText, ChevronLeft, Info } from 'lucide-react';
import { RubricForm, RubricFormData } from '@/components/RubricForm';
import { EditableRubric, RubricRow } from '@/components/EditableRubric';
import { SketchyUnderline, Handwriting } from '@/components/IllustrativeBranding';
import { chatService } from '@/lib/chat';
import { exportRubricToPDF } from '@/lib/pdf-export';
import { Toaster, toast } from 'sonner';
export function HomePage() {
  const [view, setView] = useState<'form' | 'loading' | 'result'>('form');
  const [rubricData, setRubricData] = useState<RubricRow[]>([]);
  const [formData, setFormData] = useState<RubricFormData | null>(null);
  const handleGenerate = async (data: RubricFormData) => {
    setFormData(data);
    setView('loading');
    const prompt = `Generate a structured grading rubric for: ${data.assignmentName} in ${data.subject} (${data.gradeLevel}).
    Tone: ${data.tone}. Scale: ${data.scale} levels.
    Context: ${data.context}
    CRITICAL: Return ONLY a raw JSON array of objects. No preamble.
    Example format:
    [
      {"id": "1", "criterion": "Structure", "levels": ["Expertly organized...", "Mostly organized...", "Lacks organization..."]}
    ]
    Ensure exact scale matches: each object must have "levels" array of length ${data.scale}.`;
    try {
      const response = await chatService.sendMessage(prompt);
      if (response.success) {
        // Simple extraction for robustness
        const raw = response.data?.messages[response.data.messages.length - 1]?.content || "";
        const match = raw.match(/\[.*\]/s);
        if (match) {
          const parsed = JSON.parse(match[0]);
          setRubricData(parsed);
          setView('result');
        } else {
          throw new Error("Invalid format received");
        }
      }
    } catch (err) {
      toast.error("Generation failed. Please try again with more details.");
      setView('form');
    }
  };
  return (
    <div className="min-h-screen grid-paper">
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-between items-end border-b border-primary/10 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg rotate-3 shadow-lg shadow-primary/20">
              <FileText className="text-white w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Rubric<span className="text-primary">Flow</span></h1>
          </div>
          <SketchyUnderline className="mt-[-4px]" />
        </div>
        <div className="hidden md:block">
          <Handwriting>AI-powered lesson plan architect</Handwriting>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
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
                <h2 className="text-5xl font-bold leading-tight">Create a Rubric in <span className="italic text-primary">Seconds</span></h2>
                <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
                  Forget the blank page. Tell us what you're teaching, and we'll design the perfect roadmap for student success.
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
                <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse w-8 h-8" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-bold">Drafting your masterpiece...</h3>
                <p className="text-muted-foreground italic">Consulting pedagogical standards and aligning expectations</p>
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
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setView('form')}
                  className="flex items-center gap-2 text-primary font-bold hover:underline"
                >
                  <ChevronLeft className="w-5 h-5" /> Start New
                </button>
                <div className="text-right">
                  <h2 className="text-3xl font-bold">{formData?.assignmentName}</h2>
                  <p className="text-muted-foreground">{formData?.subject} • {formData?.gradeLevel}</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 text-amber-800 text-sm">
                <Info className="w-5 h-5 shrink-0" />
                <p><strong>Educator Tip:</strong> You can click any cell to refine the language before exporting. AI rubrics are best when human-checked for specific classroom context.</p>
              </div>
              <EditableRubric 
                data={rubricData} 
                scale={formData?.scale || 4} 
                onUpdate={setRubricData}
                onExport={() => formData && exportRubricToPDF(rubricData, formData)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <footer className="py-12 border-t border-primary/10">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            Made for teachers, by code <Sparkles className="w-4 h-4" />
          </p>
          <p className="text-xs text-muted-foreground/60 max-w-lg mx-auto">
            Note: RubricFlow utilizes AI processing. There is a limit on the number of requests that can be made to the AI servers across all user apps in a given time period.
          </p>
        </div>
      </footer>
      <Toaster richColors position="top-right" />
    </div>
  );
}