import type { Modality } from "./models";
import textFixtures from "./fixtures/text-fixtures.json";
import imageFixtures from "./fixtures/image-fixtures.json";

export interface Preset {
  prompt: string;
  category: string;
  label: string;
  modality: Modality;
}

const TEXT_LABELS: Record<string, string> = {
  "Write a Python function to check if a string is a palindrome": "Palindrome Checker",
  "Write a short story about a robot discovering emotions": "Robot Emotions Story",
  "Explain how a neural network learns through backpropagation": "Backpropagation Explainer",
  "Summarize the key differences between REST and GraphQL APIs": "REST vs GraphQL",
  "What are the pros and cons of remote work?": "Remote Work Pros/Cons",
  "Implement a binary search algorithm in JavaScript with error handling": "Binary Search in JS",
  "Write a poem about the ocean at night": "Ocean Night Poem",
  "How does garbage collection work in modern programming languages?": "Garbage Collection",
  "Give me 5 tips for improving code review quality": "Code Review Tips",
};

const IMAGE_LABELS: Record<string, string> = {
  "A serene mountain landscape at sunset with a lake reflection": "Mountain Landscape",
  "A cyberpunk city street at night with neon signs and rain": "Cyberpunk City",
  "A photorealistic portrait of an elderly craftsman in his workshop": "Craftsman Portrait",
  "An abstract painting with flowing colors and geometric shapes": "Abstract Painting",
  "A cozy café interior with warm lighting and books on shelves": "Cozy Café Interior",
};

/** Set of all known preset prompts for fast exact-match lookup */
export const PRESET_PROMPTS = new Set([
  ...Object.keys(TEXT_LABELS),
  ...Object.keys(IMAGE_LABELS),
]);

export function getPresets(modality: Modality): Preset[] {
  if (modality === "text") {
    return (textFixtures as { prompt: string; category: string }[]).map((f) => ({
      prompt: f.prompt,
      category: f.category,
      label: TEXT_LABELS[f.prompt] ?? f.prompt.slice(0, 30),
      modality: "text" as const,
    }));
  }

  return (imageFixtures as { prompt: string; category: string }[]).map((f) => ({
    prompt: f.prompt,
    category: f.category,
    label: IMAGE_LABELS[f.prompt] ?? f.prompt.slice(0, 30),
    modality: "image" as const,
  }));
}
