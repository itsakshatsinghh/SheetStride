import { z } from "zod";

export const MentalModelSchema = z.object({
  analogy: z.string().min(5, "Analogy should be at least 5 characters"),
  description: z.string().min(10, "Mental model description should be at least 10 characters"),
});

export const BruteForceJourneySchema = z.object({
  brute_force_description: z.string().min(10, "Brute force description should be at least 10 characters"),
  inefficiency_observation: z.string().min(10, "Inefficiency observation should be at least 10 characters"),
  optimization_concept: z.string().min(10, "Optimization concept should be at least 10 characters"),
});

export const VisualizationStepSchema = z.object({
  action: z.string().min(2),
  description: z.string().min(5),
  state: z.record(z.string(), z.any()),
});

export const VisualizationMetadataSchema = z.object({
  type: z.enum(["array-pointers", "linkedlist-cycle", "tree-traversal", "heap-relations", "custom"]),
  initial_state: z.record(z.string(), z.any()),
  animation_steps: z.array(VisualizationStepSchema),
});

export const PolyglotBoilerplatesSchema = z.object({
  cpp: z.string().min(5, "C++ template is too short"),
  python: z.string().min(5, "Python template is too short"),
  java: z.string().min(5, "Java template is too short"),
});

export const PatternVariantSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  code_example: z.string().optional(),
});

export const CommonMistakeSchema = z.object({
  mistake_title: z.string().min(5),
  description: z.string().min(10),
});

export const QuestionLadderItemSchema = z.object({
  question_id: z.number().int().positive().optional(),
  title: z.string().min(2),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  link: z.string(),
  type: z.enum(["Introductory", "Medium", "Advanced", "Classic"]),
});

export const PatternDetailsSchema = z.object({
  pattern_name: z.string().min(3, "Pattern name must be at least 3 characters"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only"),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  family_name: z.string().min(2, "Family name must be at least 2 characters"),
  overview: z.string().min(20, "Overview must be at least 20 characters"),
  recognition_signals: z.array(z.string().min(2)).min(1, "At least one recognition signal is required"),
  mental_model: MentalModelSchema,
  brute_force_journey: BruteForceJourneySchema,
  visualization_metadata: VisualizationMetadataSchema,
  polyglot_boilerplates: PolyglotBoilerplatesSchema,
  variants: z.array(PatternVariantSchema),
  common_mistakes: z.array(CommonMistakeSchema),
  interview_perspective: z.string().min(10, "Interview perspective must be at least 10 characters"),
  related_patterns: z.array(z.string()),
  question_ladder: z.array(QuestionLadderItemSchema).min(1, "Question ladder must contain at least one question"),
  cheat_sheet: z.array(z.string().min(5)).min(1, "Cheat sheet must contain at least one tip"),
});
