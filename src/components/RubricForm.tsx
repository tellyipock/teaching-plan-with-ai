import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { GraduationCap, BookOpen, Layers, Sparkles, User } from 'lucide-react';
import { SketchyCard } from './IllustrativeBranding';
const SUBJECT_OPTIONS = [
  "Biology",
  "Chemistry",
  "Earth & Environmental Science",
  "Economics and Personal Finance",
  "English",
  "History",
  "Math",
  "Physical Science"
];
const GRADE_LEVELS = ["9th", "10th", "11th", "12th"];
const FEEDBACK_DETAIL_LABELS = ['Concise', 'Compact', 'Balanced', 'Expanded', 'Detailed'];
const formSchema = z.object({
  assignmentName: z.string().min(3, "Title is too short"),
  teacherName: z.string().optional(),
  subject: z.string().min(2, "Subject is required"),
  gradeLevel: z.string(),
  scale: z.number().min(3).max(5),
  temperature: z.number().min(0).max(1),
  feedbackDetail: z.number().min(1).max(5),
  context: z.string().min(20, "Please provide more context for the AI"),
  tone: z.enum(['Encouraging', 'Academic', 'Strict', 'Balanced', 'Casual & Friendly']),
});
export type RubricFormData = z.infer<typeof formSchema>;
interface RubricFormProps {
  onSubmit: (data: RubricFormData) => void;
  isLoading: boolean;
}
export function RubricForm({ onSubmit, isLoading }: RubricFormProps) {
  const form = useForm<RubricFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignmentName: '',
      teacherName: '',
      subject: '',
      gradeLevel: '9th',
      scale: 4,
      temperature: 0.3,
      feedbackDetail: 3,
      context: '',
      tone: 'Balanced',
    }
  });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SketchyCard className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <BookOpen className="w-5 h-5" />
            <h3>Basic Info</h3>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <User className="w-3 h-3" /> Teacher Name (Optional)
            </Label>
            <Input
              placeholder="e.g. Mr. Henderson"
              {...form.register('teacherName')}
              className="bg-muted/50 border-none focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label>Assignment Title</Label>
            <Input
              placeholder="e.g. Persuasive Essay on Climate"
              {...form.register('assignmentName')}
              className="bg-muted/50 border-none focus-visible:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Grade Level</Label>
              <Select onValueChange={(v) => form.setValue('gradeLevel', v)} defaultValue="9th">
                <SelectTrigger className="bg-muted/50 border-none">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level} Grade</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select onValueChange={(v) => form.setValue('subject', v)} value={form.watch('subject')}>
                <SelectTrigger className="bg-muted/50 border-none">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_OPTIONS.map((subj) => (
                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SketchyCard>
        <SketchyCard className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Layers className="w-5 h-5" />
            <h3>Parameters</h3>
          </div>
          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Rubric Scale (Levels)</Label>
                <span className="text-sm font-bold text-primary">{form.watch('scale')} Points</span>
              </div>
              <Slider
                value={[form.watch('scale')]}
                onValueChange={([v]) => form.setValue('scale', v)}
                min={3} max={5} step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Feedback Tone</Label>
              <Select onValueChange={(v: any) => form.setValue('tone', v)} defaultValue="Balanced">
                <SelectTrigger className="bg-muted/50 border-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Encouraging">Encouraging & Growth-focused</SelectItem>
                  <SelectItem value="Academic">Formal & Academic</SelectItem>
                  <SelectItem value="Strict">Strict & Precision-focused</SelectItem>
                  <SelectItem value="Casual & Friendly">Casual & Friendly</SelectItem>
                  <SelectItem value="Balanced">Balanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Creativity (Temperature)</Label>
                <span className="text-sm font-bold text-primary">{form.watch('temperature').toFixed(1)}</span>
              </div>
              <Slider
                value={[form.watch('temperature')]}
                onValueChange={([v]) => form.setValue('temperature', Number(v.toFixed(1)))}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Feedback Detail</Label>
                <span className="text-sm font-bold text-primary">
                  {FEEDBACK_DETAIL_LABELS[form.watch('feedbackDetail') - 1]} ({10 * form.watch('feedbackDetail')} words)
                </span>
              </div>
              <Slider
                value={[form.watch('feedbackDetail')]}
                onValueChange={([v]) => form.setValue('feedbackDetail', v)}
                min={1}
                max={5}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Concise</span>
                <span>Detailed</span>
              </div>
            </div>
          </div>
        </SketchyCard>
      </div>
      <SketchyCard className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold">
          <GraduationCap className="w-5 h-5" />
          <h3>Assignment Context</h3>
        </div>
        <div className="space-y-2">
          <Label>Prompts, Objectives, or Requirements</Label>
          <Textarea
            placeholder="Paste your assignment prompt or detailed instructions here. The more detail you provide, the better the rubric will be."
            className="min-h-[150px] bg-muted/50 border-none resize-none"
            {...form.register('context')}
          />
        </div>
      </SketchyCard>
      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="h-16 px-12 text-lg font-bold rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:scale-105 transition-transform"
        >
          {isLoading ? (
            <Sparkles className="mr-2 animate-spin" />
          ) : (
            <Sparkles className="mr-2" />
          )}
          {isLoading ? "Generating Magic..." : "Generate Masterpiece Rubric"}
        </Button>
      </div>
    </form>
  );
}