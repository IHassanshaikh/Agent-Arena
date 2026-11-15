import { ModelPricing } from './types';

export const MODEL_PRICING_CATALOG: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4o': { inputPerMillion: 5.0, outputPerMillion: 15.0 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'gpt-4-turbo': { inputPerMillion: 10.0, outputPerMillion: 30.0 },
  'o1-preview': { inputPerMillion: 15.0, outputPerMillion: 60.0 },
  'o1-mini': { inputPerMillion: 3.0, outputPerMillion: 12.0 },
  
  // Anthropic
  'claude-3-5-sonnet-20241022': { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  'claude-3-5-haiku-20241022': { inputPerMillion: 1.0, outputPerMillion: 5.0 },
  'claude-3-opus-20240229': { inputPerMillion: 15.0, outputPerMillion: 75.0 },
  
  // Google Gemini
  'gemini-2.5-flash': { inputPerMillion: 0.075, outputPerMillion: 0.3 },
  'gemini-flash-latest': { inputPerMillion: 0.075, outputPerMillion: 0.3 },
  'gemini-2.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.0 },
  'gemini-1.5-pro': { inputPerMillion: 3.5, outputPerMillion: 10.5 },
  'gemini-1.5-flash': { inputPerMillion: 0.075, outputPerMillion: 0.3 },
  'gemini-2.0-flash-exp': { inputPerMillion: 0.1, outputPerMillion: 0.4 },
  
  // Open weights / Hosted
  'meta-llama/llama-3.1-70b-instruct': { inputPerMillion: 0.9, outputPerMillion: 0.9 },
  'meta-llama/llama-3.1-8b-instruct': { inputPerMillion: 0.2, outputPerMillion: 0.2 },
  'deepseek-chat': { inputPerMillion: 0.14, outputPerMillion: 0.28 },
  'deepseek-coder': { inputPerMillion: 0.14, outputPerMillion: 0.28 },
  
  // Default fallback
  'default': { inputPerMillion: 2.0, outputPerMillion: 6.0 }
};

export const PRICING_VERSION = '2026.11.1';

export interface CostCalculationResult {
  estimated_cost_usd: number;
  input_cost_usd: number;
  output_cost_usd: number;
  is_reported: boolean;
  pricing_version: string;
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  isUsageReported: boolean = true
): CostCalculationResult {
  const normalizedModel = model.toLowerCase();
  const pricing = MODEL_PRICING_CATALOG[normalizedModel] ||
    Object.entries(MODEL_PRICING_CATALOG).find(([k]) => normalizedModel.includes(k))?.[1] ||
    MODEL_PRICING_CATALOG['default'];

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  const totalCost = inputCost + outputCost;

  return {
    estimated_cost_usd: Number(totalCost.toFixed(6)),
    input_cost_usd: Number(inputCost.toFixed(6)),
    output_cost_usd: Number(outputCost.toFixed(6)),
    is_reported: isUsageReported,
    pricing_version: PRICING_VERSION
  };
}

