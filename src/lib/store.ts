import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RubricRow } from '@/components/EditableRubric';
import { RubricFormData } from '@/components/RubricForm';
export interface SavedRubric {
  id: string;
  metadata: RubricFormData;
  data: RubricRow[];
  updatedAt: number;
}
interface RubricStore {
  savedRubrics: SavedRubric[];
  currentRubricId: string | null;
  saveRubric: (metadata: RubricFormData, data: RubricRow[]) => void;
  deleteRubric: (id: string) => void;
  loadRubric: (id: string) => SavedRubric | null;
  clearCurrent: () => void;
}
export const useRubricStore = create<RubricStore>()(
  persist(
    (set, get) => ({
      savedRubrics: [],
      currentRubricId: null,
      saveRubric: (metadata, data) => {
        const { savedRubrics, currentRubricId } = get();
        const now = Date.now();
        if (currentRubricId && savedRubrics.some(r => r.id === currentRubricId)) {
          // Update existing
          set({
            savedRubrics: savedRubrics.map((r) =>
              r.id === currentRubricId ? { ...r, metadata, data, updatedAt: now } : r
            ),
          });
        } else {
          // Create new record
          const newId = crypto.randomUUID();
          const newRubric: SavedRubric = {
            id: newId,
            metadata,
            data,
            updatedAt: now,
          };
          set({
            savedRubrics: [newRubric, ...savedRubrics],
            currentRubricId: newId,
          });
        }
      },
      deleteRubric: (id) => {
        const { savedRubrics, currentRubricId } = get();
        set({
          savedRubrics: savedRubrics.filter((r) => r.id !== id),
          currentRubricId: currentRubricId === id ? null : currentRubricId,
        });
      },
      loadRubric: (id) => {
        const { savedRubrics } = get();
        const rubric = savedRubrics.find((r) => r.id === id) || null;
        if (rubric) {
          set({ currentRubricId: id });
        }
        return rubric;
      },
      clearCurrent: () => set({ currentRubricId: null }),
    }),
    {
      name: 'lineared-storage-v2',
      version: 4,
      partialize: (state) => ({
        savedRubrics: state.savedRubrics,
        currentRubricId: state.currentRubricId
      }),
      migrate: (persistedState: any, version: number) => {
        let state = persistedState as any;
        if (version < 4) {
          // Migration from older schemas to current metadata shape
          const rubrics = state?.savedRubrics || [];
          state = {
            ...state,
            savedRubrics: rubrics.map((r: any) => ({
              ...r,
              metadata: {
                ...r.metadata,
                teacherName: r.metadata?.teacherName ?? '',
                tone: r.metadata?.tone ?? 'Balanced',
                gradeLevel: r.metadata?.gradeLevel ?? '9th',
                temperature: typeof r.metadata?.temperature === 'number' ? r.metadata.temperature : 0.3,
                feedbackDetail: typeof r.metadata?.feedbackDetail === 'number' ? r.metadata.feedbackDetail : 3,
              }
            }))
          };
        }
        // Final validation: Ensure empty state structure is valid if corrupted
        return {
          savedRubrics: Array.isArray(state?.savedRubrics) ? state.savedRubrics : [],
          currentRubricId: typeof state?.currentRubricId === 'string' ? state.currentRubricId : null
        };
      }
    }
  )
);