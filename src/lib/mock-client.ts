import { getModelById, type Model } from "./models";

// Per-model response styles for noticeably different outputs
const MODEL_STYLES: Record<string, { prefix: string; style: string; lengthMultiplier: number }> = {
  "llama-3-8b": {
    prefix: "",
    style: "concise",
    lengthMultiplier: 0.7,
  },
  "llama-3-70b": {
    prefix: "",
    style: "thorough",
    lengthMultiplier: 1.3,
  },
  "llama-2-70b": {
    prefix: "",
    style: "conversational",
    lengthMultiplier: 1.0,
  },
  "mixtral-8x7b": {
    prefix: "",
    style: "structured",
    lengthMultiplier: 1.1,
  },
  "gemma-7b": {
    prefix: "",
    style: "brief",
    lengthMultiplier: 0.6,
  },
};

// Canned text responses keyed by category, with per-model variants
const TEXT_RESPONSES: Record<string, Record<string, string>> = {
  default: {
    concise: `Here's a quick take on your question.

**Key points:**
1. Consider the context and why it matters
2. There are multiple valid perspectives here
3. Balance short-term and long-term implications

The best approach balances multiple factors. Let me know if you'd like me to dig deeper into any of these.`,

    thorough: `This is an excellent question that deserves a comprehensive analysis. Let me walk through this systematically.

## Understanding the Context

First, it's crucial to understand *why* this matters. The question touches on fundamental aspects that many people find relevant, and the answer isn't as straightforward as it might initially appear.

## Key Considerations

There are multiple angles to approach this from:

1. **The pragmatic view** — Focus on what works in practice. Each perspective offers unique insights that contribute to a more complete understanding.

2. **The theoretical framework** — Understanding the underlying principles helps us make better decisions when facing novel situations.

3. **The empirical evidence** — What does the data actually tell us? Often, our intuitions don't match reality.

## Practical Implications

In practice, this means you should consider both the short-term effects and the long-term consequences of any decisions related to this topic. The interplay between these timeframes is where most of the complexity lies.

## My Recommendation

The best approach is usually one that balances multiple factors while remaining adaptable to new information as it becomes available. I'd suggest starting with a clear framework, testing your assumptions, and iterating based on results.

Would you like me to elaborate on any specific aspect?`,

    conversational: `Great question! Let me share my thoughts on this.

So, there are a few things to consider here. First off, the context really matters — what you're asking about touches on some pretty fundamental stuff that a lot of people think about.

Here's how I'd break it down:

1. **Understanding the context** — It's important to think about what you're asking and why it matters.

2. **Multiple perspectives** — There are several angles you can look at this from. Each one gives you something different.

3. **What it means in practice** — You'll want to think about both short-term and long-term effects.

4. **Bottom line** — The best approach usually balances multiple factors while staying flexible.

Hope that helps! Happy to dive deeper if you want. 😊`,

    structured: `## Analysis

### Context
The question addresses fundamental aspects with broad relevance.

### Key Considerations
| Aspect | Description |
|--------|-------------|
| Context | Understanding why the question matters |
| Perspectives | Multiple valid approaches exist |
| Implications | Both short-term and long-term effects |

### Recommendations
1. Balance multiple factors
2. Remain adaptable to new information
3. Consider both immediate and downstream consequences

### Conclusion
A balanced approach that accounts for multiple factors tends to yield the best outcomes. Adaptability is key.`,

    brief: `Here's my take:

1. Context matters — consider why you're asking
2. Multiple approaches work, each with tradeoffs
3. Balance short-term wins with long-term goals

Best approach: stay adaptable and consider multiple factors.`,
  },
  code: {
    concise: `Here's the solution:

\`\`\`typescript
function solve(input: string): string {
  return input.trim().split('\\n')
    .map((line, i) => \`\${i + 1}. \${line.toLowerCase().replace(/[^a-z0-9]/g, '-')}\`)
    .join('\\n');
}

console.log(solve("Hello World\\nFoo Bar"));
// 1. hello-world
// 2. foo-bar
\`\`\`

Handles special characters and empty lines.`,

    thorough: `Let me provide a comprehensive solution with proper error handling and documentation.

\`\`\`typescript
/**
 * Processes multi-line input into a numbered, normalized format.
 * - Converts to lowercase
 * - Replaces non-alphanumeric chars with hyphens
 * - Numbers each line sequentially
 */
function solve(input: string): string {
  if (!input || !input.trim()) {
    return '';
  }

  const data = input.trim().split('\\n');

  const results = data
    .filter(line => line.trim().length > 0)
    .map((line, index) => {
      const processed = line
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      return \`\${index + 1}. \${processed}\`;
    });

  return results.join('\\n');
}

// Example usage
const output = solve("Hello World\\nFoo Bar\\n  Baz Qux  ");
console.log(output);
// 1. hello-world
// 2. foo-bar
// 3. baz-qux
\`\`\`

### Key Design Decisions

1. **Empty line filtering** — Blank lines are skipped to avoid meaningless entries
2. **Trim handling** — Leading/trailing whitespace is cleaned per-line
3. **Consecutive separators** — Multiple non-alphanumeric chars collapse into a single hyphen
4. **Edge hyphens** — Leading/trailing hyphens are removed

This is production-ready and can be extended with custom transformers if needed.`,

    conversational: `Sure thing! Here's how I'd tackle this:

\`\`\`typescript
function solve(input: string): string {
  // Split the input into lines
  const data = input.trim().split('\\n');

  // Process each line - lowercase and clean up special chars
  const results = data.map((line, index) => {
    const processed = line.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return \`\${index + 1}. \${processed}\`;
  });

  return results.join('\\n');
}

// Let's test it out!
const output = solve("Hello World\\nFoo Bar");
console.log(output);
// 1. hello-world
// 2. foo-bar
\`\`\`

Pretty straightforward, right? The key trick is using that regex to swap out anything that's not a letter or number. You could also add validation if you wanted to be extra safe.`,

    structured: `## Solution

### Implementation
\`\`\`typescript
function solve(input: string): string {
  const data = input.trim().split('\\n');
  const results = data.map((line, index) => {
    const processed = line.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return \`\${index + 1}. \${processed}\`;
  });
  return results.join('\\n');
}
\`\`\`

### Test Cases
| Input | Output |
|-------|--------|
| \`"Hello World"\` | \`"1. hello-world"\` |
| \`"Foo Bar\\nBaz"\` | \`"1. foo-bar\\n2. baz"\` |

### Complexity
- **Time:** O(n·m) where n = lines, m = avg line length
- **Space:** O(n·m) for result array`,

    brief: `\`\`\`typescript
function solve(input: string): string {
  return input.trim().split('\\n')
    .map((l, i) => \`\${i+1}. \${l.toLowerCase().replace(/[^a-z0-9]/g, '-')}\`)
    .join('\\n');
}
\`\`\`

Works for the standard cases. Extend with validation if needed.`,
  },
  explain: {
    concise: `It works by breaking the problem into three steps:

1. **Parse** — Validate the raw input, reject bad data early
2. **Process** — Apply transformations using defined rules
3. **Assemble** — Collect results into the final output

Each stage is independent and testable. That's what makes it elegant.`,

    thorough: `Great question — let me give you a thorough explanation.

## The High-Level Picture

At its core, this works by decomposing the problem into independent stages. This is a classic pattern in software engineering called the **pipeline pattern**, and it's powerful because each stage can be understood, tested, and optimized in isolation.

## Stage-by-Stage Breakdown

### Stage 1: Input Processing
The raw input is parsed and validated. This is your first line of defense — any malformed data is rejected early to prevent downstream errors. Think of it as a bouncer at the door: if your data doesn't meet the minimum requirements, it doesn't get in.

**Why this matters:** Catching errors early is exponentially cheaper than catching them late. A validation error at the input stage is a clear message; the same bad data causing a cryptic failure three stages later is a debugging nightmare.

### Stage 2: Core Logic
This is where the main computation happens. The algorithm iterates through the processed data, applying transformations based on the defined rules. The key insight is that by this point, you're guaranteed to be working with clean, valid data — so the core logic can focus purely on the business requirements.

### Stage 3: Output Assembly
The individual results are collected, formatted, and returned as a cohesive response. This stage handles serialization, formatting, and any final transformations needed for the consumer.

## Why This Design Works

The elegance lies in the **separation of concerns**:
- Input handling knows nothing about business logic
- Business logic assumes clean data
- Output formatting is decoupled from computation

This makes the system maintainable, testable, and extensible. Need to support a new input format? Just modify Stage 1. New business rule? Stage 2. Different output format? Stage 3.`,

    conversational: `Ah, good question! Let me break this down in a way that makes sense.

So basically, it works by splitting the problem into three chunks:

**Step 1: Getting the input ready**
First, you take the raw input and clean it up. Validate it, make sure it looks right, and toss out anything that's garbage. Better to catch problems early!

**Step 2: Doing the actual work**
This is where the magic happens. You loop through your clean data and apply whatever rules or transformations you need. Since you already validated everything in step 1, you don't have to worry about weird edge cases here.

**Step 3: Putting it all together**
Finally, take all those individual results and package them up nicely. Format them, combine them, and return the final answer.

The cool thing about this approach? Each step is totally independent. You can test them separately, change one without breaking the others, and it's way easier to understand than one big monolithic function.`,

    structured: `## How It Works

### Architecture: Pipeline Pattern

\`\`\`
Input → [Validate] → [Transform] → [Assemble] → Output
\`\`\`

### Stage Breakdown

| Stage | Purpose | Key Principle |
|-------|---------|---------------|
| 1. Input Processing | Parse & validate | Fail fast |
| 2. Core Logic | Apply transformations | Single responsibility |
| 3. Output Assembly | Format results | Separation of concerns |

### Benefits
- **Testability**: Each stage is independently testable
- **Maintainability**: Changes are localized to one stage
- **Extensibility**: New requirements map to specific stages`,

    brief: `Three stages:
1. **Parse** — validate input, reject bad data
2. **Process** — apply transformations
3. **Assemble** — format and return results

Each stage is independent and testable. That's the key insight.`,
  },
  creative: {
    concise: "__PROMPT_TEMPLATE__",
    thorough: "__PROMPT_TEMPLATE__",
    conversational: "__PROMPT_TEMPLATE__",
    structured: "__PROMPT_TEMPLATE__",
    brief: "__PROMPT_TEMPLATE__",
  },
};

function pickCategory(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("code") || lower.includes("function") || lower.includes("implement") || lower.includes("write a program")) {
    return "code";
  }
  if (lower.includes("explain") || lower.includes("how") || lower.includes("why") || lower.includes("what is")) {
    return "explain";
  }
  if (lower.includes("story") || lower.includes("creative") || lower.includes("poem") || lower.includes("write")) {
    return "creative";
  }
  return "default";
}

function extractTopic(prompt: string): string {
  // Strip common prefixes to get the core topic
  return prompt
    .replace(/^(write|tell|create|give)\s+(me\s+)?(a\s+)?(short\s+)?(story|tale|poem|piece)\s+(about|on|of)\s+/i, "")
    .replace(/^(explain|describe|how|why|what is)\s+/i, "")
    .trim();
}

function generateCreativeResponse(prompt: string, style: string): string {
  const topic = extractTopic(prompt) || prompt;

  const templates: Record<string, (t: string) => string> = {
    concise: (t) => `The tale of ${t} began on a night when the moon hung low and heavy.

No one expected what happened next. It started small — a whisper, a shadow, a flicker of something just out of sight. But by morning, everything had changed.

Some say it was inevitable. Others call it fate. But those who were there know the truth: ${t} was never just a story. It was a warning.`,

    thorough: (t) => `It began, as most extraordinary things do, without any warning at all.

The story of ${t} had been told in fragments for generations — a sentence here, a rumor there, woven into the fabric of local legend until no one could quite remember where truth ended and myth began.

## The Beginning

On the evening it all started, the air itself seemed to hum with anticipation. Old Maren, who kept the shop on the corner of Thistle Lane, was the first to notice. "Something's different tonight," she muttered to her cat, who merely blinked in response. She wasn't wrong.

## The Heart of the Matter

What followed was a chain of events so improbable that even the town's most seasoned storytellers struggled to keep up. ${t} — it was the kind of thing you'd dismiss as fantasy if you read it in a book. But this wasn't a book. This was happening.

The details emerged slowly, like a photograph developing in a darkroom. Each new revelation cast the previous ones in a different light, until the whole picture was something no one could have predicted.

## The Reckoning

By the time dawn broke over the hills, three things had become clear: nothing would ever be quite the same, the old stories had been more right than anyone realized, and ${t} was only the beginning.

The town held its breath. And then, slowly, life continued — but with a new awareness, a new respect for the extraordinary hiding in plain sight.`,

    conversational: (t) => `Okay so you want to hear about ${t}? Buckle up, because this one's wild.

So picture this — it's late, the kind of late where even the streetlights look tired. And that's when it all kicked off. ${t}, right there, like something out of a fever dream.

At first nobody believed it. Like, come on. But then the evidence started piling up, and suddenly everyone had a theory. My favorite was old Jim's: "I always knew something like this would happen." Sure you did, Jim. Sure you did.

The best part? The ending. I won't spoil it, but let's just say... nobody saw it coming. And if someone tells you they did? They're lying.

Some stories are too good to only tell once. This is one of them.`,

    structured: (t) => `## ${t.charAt(0).toUpperCase() + t.slice(1)}

**Setting:** A world where the ordinary meets the extraordinary

---

It started without fanfare — ${t}, unfolding in the space between one heartbeat and the next.

**Act I: The Discovery**
> Something stirred in the shadows. Not quite seen, but undeniably felt.

**Act II: The Confrontation**
The moment of truth arrived:
- A choice was made
- A line was crossed
- There was no going back

**Act III: The Resolution**
And when it was over, the world looked the same. But it wasn't. Not anymore.

---

*Some tales change the teller as much as the listener. This was one of them.*`,

    brief: (t) => `${t.charAt(0).toUpperCase() + t.slice(1)}.

It happened fast. One moment, silence. The next, everything.

No one was ready. But then again — are we ever?

The end came quietly, as endings do.`,
  };

  const generator = templates[style] ?? templates["concise"];
  return generator(topic);
}

function getModelResponse(prompt: string, model: Model): string {
  const category = pickCategory(prompt);
  const style = MODEL_STYLES[model.id]?.style ?? "concise";

  if (category === "creative") {
    return generateCreativeResponse(prompt, style);
  }

  const responses = TEXT_RESPONSES[category];
  return responses[style] ?? responses["concise"];
}

// ~10% failure rate for gemma-7b to test error handling
function shouldFail(modelId: string): boolean {
  if (modelId === "gemma-7b") return Math.random() < 0.1;
  return false;
}

// Mock placeholder image URLs (solid color SVG data URIs for different "styles")
const MOCK_IMAGES: Record<string, string> = {
  sdxl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%234F46E5'/%3E%3Cstop offset='100%25' style='stop-color:%237C3AED'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='512' height='512' fill='url(%23g)'/%3E%3Ctext x='256' y='240' text-anchor='middle' fill='white' font-size='24' font-family='system-ui'%3ESDXL Output%3C/text%3E%3Ctext x='256' y='280' text-anchor='middle' fill='rgba(255,255,255,0.7)' font-size='16' font-family='system-ui'%3E1024x1024 - High Quality%3C/text%3E%3C/svg%3E",
  "sdxl-lightning": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23F59E0B'/%3E%3Cstop offset='100%25' style='stop-color:%23EF4444'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='512' height='512' fill='url(%23g)'/%3E%3Ctext x='256' y='240' text-anchor='middle' fill='white' font-size='24' font-family='system-ui'%3ESDXL Lightning%3C/text%3E%3Ctext x='256' y='280' text-anchor='middle' fill='rgba(255,255,255,0.7)' font-size='16' font-family='system-ui'%3E4-Step - Ultra Fast%3C/text%3E%3C/svg%3E",
  "flux-schnell": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2306B6D4'/%3E%3Cstop offset='100%25' style='stop-color:%233B82F6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='512' height='512' fill='url(%23g)'/%3E%3Ctext x='256' y='240' text-anchor='middle' fill='white' font-size='24' font-family='system-ui'%3EFLUX.1 Schnell%3C/text%3E%3Ctext x='256' y='280' text-anchor='middle' fill='rgba(255,255,255,0.7)' font-size='16' font-family='system-ui'%3EFastest Generation%3C/text%3E%3C/svg%3E",
  "flux-dev": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%238B5CF6'/%3E%3Cstop offset='100%25' style='stop-color:%23EC4899'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='512' height='512' fill='url(%23g)'/%3E%3Ctext x='256' y='240' text-anchor='middle' fill='white' font-size='24' font-family='system-ui'%3EFLUX.1 Dev%3C/text%3E%3Ctext x='256' y='280' text-anchor='middle' fill='rgba(255,255,255,0.7)' font-size='16' font-family='system-ui'%3EHighest Quality%3C/text%3E%3C/svg%3E",
  "playground-v2": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2310B981'/%3E%3Cstop offset='100%25' style='stop-color:%2334D399'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='512' height='512' fill='url(%23g)'/%3E%3Ctext x='256' y='240' text-anchor='middle' fill='white' font-size='24' font-family='system-ui'%3EPlayground v2.5%3C/text%3E%3Ctext x='256' y='280' text-anchor='middle' fill='rgba(255,255,255,0.7)' font-size='16' font-family='system-ui'%3EAesthetic Optimized%3C/text%3E%3C/svg%3E",
};

export interface PredictionResult {
  id: string;
  status: "succeeded" | "failed";
  output: string;
  latencyMs: number;
  cost: number;
  error?: string;
}

export interface StreamEvent {
  type: "token" | "done" | "error";
  data: string;
}

// Simulate running an image model
export async function mockImagePrediction(
  modelId: string,
  signal?: AbortSignal
): Promise<PredictionResult> {
  const model = getModelById(modelId);
  if (!model || model.modality !== "image") {
    throw new Error(`Model ${modelId} is not an image model`);
  }

  if (shouldFail(modelId)) {
    const latency = 500 + Math.random() * 500;
    await new Promise((resolve) => setTimeout(resolve, latency));
    return {
      id: `pred_${Date.now()}_${modelId}`,
      status: "failed",
      output: "",
      latencyMs: Math.round(latency),
      cost: 0,
      error: "GPU memory allocation failed. Please try again.",
    };
  }

  const variance = model.avgLatencyMs * 0.2;
  const latency = model.avgLatencyMs + (Math.random() * variance * 2 - variance);

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, latency);
    signal?.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

  return {
    id: `pred_${Date.now()}_${modelId}`,
    status: "succeeded",
    output: MOCK_IMAGES[modelId] || MOCK_IMAGES.sdxl,
    latencyMs: Math.round(latency),
    cost: model.costPerRun,
  };
}

// Simulate streaming text model - yields tokens one by one
export async function* mockTextStream(
  modelId: string,
  prompt: string,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const model = getModelById(modelId);
  if (!model || model.modality !== "text") {
    throw new Error(`Model ${modelId} is not a text model`);
  }

  if (shouldFail(modelId)) {
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 400));
    yield { type: "error", data: "Model inference failed: CUDA out of memory" };
    return;
  }

  const response = getModelResponse(prompt, model);
  const tokens = response.split(/(?<=\s)/);

  // Per-model streaming speed: lengthMultiplier affects total time feel
  const multiplier = MODEL_STYLES[model.id]?.lengthMultiplier ?? 1.0;
  const totalTime = (model.avgLatencyMs * multiplier) + (Math.random() * model.avgLatencyMs * 0.4 - model.avgLatencyMs * 0.2);
  const delayPerToken = totalTime / tokens.length;

  for (const token of tokens) {
    if (signal?.aborted) return;
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, delayPerToken);
      signal?.addEventListener("abort", () => {
        clearTimeout(timeout);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
    yield { type: "token", data: token };
  }

  yield { type: "done", data: "" };
}

// Non-streaming text prediction (returns all at once)
export async function mockTextPrediction(
  modelId: string,
  prompt: string,
  signal?: AbortSignal
): Promise<PredictionResult> {
  const model = getModelById(modelId);
  if (!model || model.modality !== "text") {
    throw new Error(`Model ${modelId} is not a text model`);
  }

  if (shouldFail(modelId)) {
    return {
      id: `pred_${Date.now()}_${modelId}`,
      status: "failed",
      output: "",
      latencyMs: 500,
      cost: 0,
      error: "Model inference failed: CUDA out of memory",
    };
  }

  const response = getModelResponse(prompt, model);
  const variance = model.avgLatencyMs * 0.2;
  const latency = model.avgLatencyMs + (Math.random() * variance * 2 - variance);

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, latency);
    signal?.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

  return {
    id: `pred_${Date.now()}_${modelId}`,
    status: "succeeded",
    output: response,
    latencyMs: Math.round(latency),
    cost: model.costPerRun,
  };
}
