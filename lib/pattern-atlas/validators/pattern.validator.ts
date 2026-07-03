import { PatternDetailsSchema } from "../schemas/pattern.schema";
import { supabase } from "../../supabase";

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

export async function validatePattern(
  pattern: any,
  checkSupabase: boolean = true
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validate Zod Schema
  const parseResult = PatternDetailsSchema.safeParse(pattern);
  if (!parseResult.success) {
    for (const issue of parseResult.error.issues) {
      errors.push(`[Schema] Field "${issue.path.join(".")}" - ${issue.message}`);
    }
  }

  if (!parseResult.success) {
    return { success: false, errors, warnings };
  }

  const validData = parseResult.data;

  // 2. Check for duplicate recognition signals (case-insensitive)
  const signals = validData.recognition_signals.map(s => s.trim().toLowerCase());
  const uniqueSignals = new Set(signals);
  if (signals.length !== uniqueSignals.size) {
    warnings.push("[Signals] Duplicate recognition signals found in metadata");
  }

  // 3. Check for duplicate questions in the ladder
  const questionIds = validData.question_ladder
    .map(q => q.question_id)
    .filter((id): id is number => typeof id === "number");
    
  const uniqueQuestionIds = new Set(questionIds);
  if (questionIds.length !== uniqueQuestionIds.size) {
    errors.push("[Ladder] Duplicate question IDs found in the question ladder");
  }

  // 4. Validate question IDs against Supabase if requested
  if (checkSupabase && questionIds.length > 0) {
    // Check if env vars are present or fallbacks are used
    const hasCredentials =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (hasCredentials) {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("ID")
          .in("ID", questionIds);

        if (error) {
          warnings.push(`[Supabase] Failed to verify question IDs: ${error.message}`);
        } else {
          const foundIds = new Set(data?.map(q => q.ID) || []);
          for (const qId of questionIds) {
            if (!foundIds.has(qId)) {
              errors.push(`[Supabase] Question ID ${qId} does not exist in the questions table`);
            }
          }
        }
      } catch (err: any) {
        warnings.push(`[Supabase] Connection error during validation: ${err.message}`);
      }
    } else {
      warnings.push("[Supabase] Skipped question ID lookup because Supabase env variables are missing or placeholders");
    }
  }

  // 5. Validate Visualization Metadata step structures
  const visType = validData.visualization_metadata.type;
  const steps = validData.visualization_metadata.animation_steps;

  if (steps.length === 0) {
    warnings.push("[Visualization] No animation steps defined in visualization_metadata");
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (visType === "array-pointers") {
      if (step.state.pointers && typeof step.state.pointers !== "object") {
        errors.push(`[Visualization] Step ${i} ("${step.action}"): pointers in state must be an object`);
      }
    } else if (visType === "linkedlist-cycle") {
      if (step.state.slow === undefined || step.state.fast === undefined) {
        warnings.push(`[Visualization] Step ${i} ("${step.action}"): missing "slow" or "fast" state index for linkedlist-cycle`);
      }
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}
