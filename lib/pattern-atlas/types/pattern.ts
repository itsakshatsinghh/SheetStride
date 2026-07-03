export interface MentalModel {
  analogy: string;
  description: string;
}

export interface BruteForceJourney {
  brute_force_description: string;
  inefficiency_observation: string;
  optimization_concept: string;
}

export interface VisualizationStep {
  action: string;
  description: string;
  state: Record<string, any>;
}

export interface VisualizationMetadata {
  type: "array-pointers" | "linkedlist-cycle" | "tree-traversal" | "heap-relations" | "custom";
  initial_state: Record<string, any>;
  animation_steps: VisualizationStep[];
}

export interface PolyglotBoilerplates {
  cpp: string;
  python: string;
  java: string;
}

export interface PatternVariant {
  name: string;
  description: string;
  code_example?: string;
}

export interface CommonMistake {
  mistake_title: string;
  description: string;
}

export interface QuestionLadderItem {
  question_id?: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  link: string;
  type: "Introductory" | "Medium" | "Advanced" | "Classic";
}

export interface PatternDetails {
  pattern_name: string;
  slug: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  family_name: string;
  overview: string;
  recognition_signals: string[];
  mental_model: MentalModel;
  brute_force_journey: BruteForceJourney;
  visualization_metadata: VisualizationMetadata;
  polyglot_boilerplates: PolyglotBoilerplates;
  variants: PatternVariant[];
  common_mistakes: CommonMistake[];
  interview_perspective: string;
  related_patterns: string[]; // references to pattern slugs
  question_ladder: QuestionLadderItem[];
  cheat_sheet: string[];
}

export interface PatternAtlasIndexItem {
  pattern_name: string;
  slug: string;
  difficulty: string;
  family_name: string;
  recognition_signals: string[];
  variants: string[];
  companies: string[];
  questions_count: number;
}

export interface PatternAtlasIndex {
  patterns: PatternAtlasIndexItem[];
}
