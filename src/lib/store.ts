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
        if (currentRubricId) {
          set({
            savedRubrics: savedRubrics.map((r) =>
              r.id === currentRubricId ? { ...r, metadata, data, updatedAt: now } : r
            ),
          });
        } else {
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
        const rubric = get().savedRubrics.find((r) => r.id === id) || null;
        if (rubric) {
          set({ currentRubricId: id });
        }
        return rubric;
      },
      clearCurrent: () => set({ currentRubricId: null }),
    }),
    {
      name: 'rubric-storage',
      // Ensure hydration happens cleanly in browser
      partialize: (state) => ({ 
        savedRubrics: state.savedRubrics,
        currentRubricId: state.currentRubricId 
      }),
    }
  )
);