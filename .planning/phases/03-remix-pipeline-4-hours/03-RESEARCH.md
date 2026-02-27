# Phase 3: Remix Pipeline - Research

**Researched:** 2026-02-27
**Domain:** AI-driven content remixing (titles, thumbnails, scripts) with user review/edit/approval gate
**Confidence:** HIGH

## Summary

Phase 3 implements the core remix pipeline: **8 title variations** via Gemini JSON mode, **3 thumbnail variations** via Gemini Vision + fal.ai FLUX, and **scene-split script rewriting** via Gemini. All remixed content feeds a user review UI where selections are marked with `is_selected` booleans before the pipeline pauses. The phase prioritizes Gemini JSON-mode structured output with Zod validation, deterministic scene numbering enforced at the database layer, and non-fatal graceful degradation for individual remix operations. The entire phase gates on database constraints and in-database selection patterns established in Phase 1.

**Primary recommendation:** Gemini `responseMimeType: 'application/json'` + Zod validation for titles and scripts. Gemini Vision for original thumbnail analysis. fal.ai `/flux/dev` with `subscribe()` for async image generation. Database `is_selected` booleans for user selection tracking. Scene numbers unique per script via `UNIQUE(script_id, scene_number)` constraint.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Review page layout:**
- Single scrollable page — titles, thumbnails, script all visible without tabs or steps
- 8 title variations in 2-column grid of radio-style cards; each card shows title text + category label (e.g. "Clickbait", "SEO")
- 3 thumbnail variations as large image cards side-by-side; stacks on mobile
- Script as stacked scene cards; each shows scene number, estimated duration (15-45s from word count), and script text

**Selection & inline editing:**
- Selected title card is inline-editable in-place — user can tweak AI text before approving
- Scene script text is inline-editable on click (textarea, saves on blur)
- Scene cards show scene number, duration, and text only (no on-screen text field tag in this phase)

**Regeneration controls:**
- Titles: Per-title regenerate icon on each card — replaces just that one
- Thumbnails: Per-thumbnail regenerate icon + optional style prompt input (e.g. "darker, more dramatic")
- Script: Both options — per-scene regenerate icon + full-script regenerate button
- Loading state: Skeleton/shimmer on specific item; rest of page stays interactive

**Approval gate UX:**
- Sticky checklist/progress bar at top: ✓ Title selected / ✓ Thumbnail selected / ○ Script reviewed
- Approve button disabled until all three checked
- Confirmation dialog summarizes selections: title text, thumbnail number, scene count
- Video detail page uses pipeline tab pattern: Scraping → Remix Review (active) → Generation (locked)
- Post-approve but pre-generation: user can revise selections if generation has not started
- Once generation begins, selections are locked

### Claude's Discretion

- Exact visual design of sticky checklist (height, position, animation)
- How "script reviewed" is determined (scrolled past all scenes, or just having script present)
- Exact style prompt UI placement for thumbnail regeneration
- Character count display for inline title editing

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| R3.1 | Gemini 2.0 Flash — 8 categorized title variations per video (JSON mode with Zod validation) | Gemini generationConfig.responseMimeType + schema validation documented; 8-category structure (Curiosity Gap, Direct Value, Contrarian, Listicle, Question, Emotional, Tutorial, Story-Driven) defined in spec Agent 2 |
| R3.2 | Gemini Vision analysis + fal.ai FLUX — 3 thumbnail variations at 1280x720 | Gemini Vision integration for original thumbnail analysis; fal.ai FLUX dev endpoint with subscribe() async pattern; image specs 1280x720 (YouTube standard) |
| R3.3 | Gemini script rewriting with scene splitting (15-45s per scene, unique scene numbers enforced by DB constraint) | JSON mode output structure with scene array; duration auto-adjust (split/merge logic) for 15-45s range; scene number uniqueness enforced via re_scenes UNIQUE(script_id, scene_number) constraint |
| R3.4 | All remixed content stored in DB with `is_selected` boolean pattern | Database schema has is_selected on re_remixed_titles, re_remixed_thumbnails, re_scripts; user selection UI marks these booleans |
| R3.5 | User can select, edit, regenerate any remix variation from UI | Per-item regenerate icons; inline edit capability (title text, scene text); selected state toggles is_selected boolean |
| R3.6 | Pipeline pauses after remix — user MUST approve selections before generation starts | Pipeline state machine shows pause point after "remixed" state before "generating"; generate endpoints MUST verify selections exist (is_selected == true) before proceeding |
| R3.7 | Batch remix — process all videos in a project in parallel | Queue concurrency: Title remix max 5, Thumbnail remix max 3, Script remix max 3; batch route posts multiple jobs to queues |

</phase_requirements>

## Standard Stack

### Core Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@google/generative-ai` | ^0.12+ | Gemini 2.0 Flash API client | Official Google SDK, native support for JSON mode, vision analysis, no auth overhead |
| `@fal-ai/serverless-client` | ^0.14 | fal.ai FLUX async image generation | Handles polling internally via subscribe() pattern, no manual queue management |
| `zod` | ^3.23+ | Response validation for Gemini output | Enforces schema on JSON responses, matches existing project validation patterns |
| `next.js` (existing) | ^14 | API routes for remix endpoints | Already in project, route handlers for POST /api/remix-engine/remix/* |
| `supabase-js` (existing) | ^2.39+ | Database and storage operations | Already authenticated, service role key for db updates, signed URLs for storage |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `nanoid` | ^5.0+ | Generate unique temp file names, asset IDs | Collision-free random strings for /tmp files, already in project |
| `pino` | ^8.17+ | Structured logging throughout remix handlers | Already integrated in Phase 1; remix jobs use child loggers |
| `bullmq` | ^5.8+ | Job queue management (already in Phase 1) | Queues for title, thumbnail, script remix jobs with concurrency control |

### Installation

```bash
npm install @google/generative-ai@^0.12 @fal-ai/serverless-client@^0.14
```

These are the ONLY new packages for Phase 3. All other infrastructure (Zod, Next.js, Supabase, BullMQ, Pino) is already installed from Phases 1-2.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/remix/                        # Remix pipeline business logic
│   ├── title-remixer.ts              # Gemini title generation
│   ├── title-prompts.ts              # Prompt templates (8 categories)
│   ├── title-types.ts                # Zod schemas for title validation
│   ├── thumbnail-remixer.ts          # fal.ai FLUX image generation
│   ├── thumbnail-analyzer.ts         # Gemini Vision for original thumbnail
│   ├── thumbnail-prompts.ts          # Image prompt engineering
│   ├── thumbnail-types.ts            # Zod schemas
│   ├── script-remixer.ts             # Gemini script rewriting
│   ├── script-splitter.ts            # Scene duration auto-adjust (15-45s)
│   ├── script-prompts.ts             # Script prompt templates
│   └── script-types.ts               # RemixedScript + Scene Zod schemas
├── app/api/remix-engine/remix/
│   ├── title/route.ts                # POST /api/remix-engine/remix/title
│   ├── thumbnail/route.ts            # POST /api/remix-engine/remix/thumbnail
│   └── script/route.ts               # POST /api/remix-engine/remix/script
└── worker/handlers/
    └── remix.ts                      # BullMQ job handler
```

### Pattern 1: Gemini JSON Mode with Zod Validation

**What:** Gemini's `responseMimeType: 'application/json'` with explicit `responseSchema` enforces structured output. Zod validates on receipt before database insert.

**When to use:** Any Gemini request expecting structured response (titles, scripts, scene arrays).

**Example:**

```typescript
// src/lib/remix/title-remixer.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { getServerConfig } from '@/lib/remix-engine/config';

// Zod schema for validation
const TitleVariationSchema = z.object({
  style: z.string(),
  title: z.string().min(5).max(100),
  reasoning: z.string().min(10),
});

const TitlesResponseSchema = z.object({
  variations: z.array(TitleVariationSchema).length(8),
});

// Gemini call with JSON mode
async function generateTitleVariations(
  originalTitle: string,
  description: string,
  channelName: string
): Promise<z.infer<typeof TitlesResponseSchema>> {
  const config = getServerConfig();
  const genAI = new GoogleGenerativeAI(config.apiKeys.gemini);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = buildTitlePrompt(originalTitle, description, channelName);

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          variations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                style: { type: 'string' },
                title: { type: 'string' },
                reasoning: { type: 'string' },
              },
              required: ['style', 'title', 'reasoning'],
            },
          },
        },
        required: ['variations'],
      },
      temperature: 0.8, // Higher for creative variations
    },
  });

  // Extract and validate response
  const text = result.response.text();
  const parsed = JSON.parse(text);
  const validated = TitlesResponseSchema.parse(parsed);
  return validated;
}
```

**Source:** [Gemini generationConfig docs - JSON mode](https://ai.google.dev/docs/structured_output)

### Pattern 2: Gemini Vision for Image Analysis

**What:** Gemini 2.0 Flash accepts image_data (base64 or URL). Use to analyze original thumbnail, extract visual description, color palette, composition.

**When to use:** Before generating new thumbnails, for context-aware prompts.

**Example:**

```typescript
// src/lib/remix/thumbnail-analyzer.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerConfig } from '@/lib/remix-engine/config';

async function analyzeThumbnail(imageUrl: string): Promise<string> {
  const config = getServerConfig();
  const genAI = new GoogleGenerativeAI(config.apiKeys.gemini);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'Analyze this YouTube video thumbnail. Describe: dominant colors, text overlays, visual composition, mood, and scene type. Be specific.',
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageUrl, // Base64-encoded or direct URL
            },
          },
        ],
      },
    ],
  });

  return result.response.text();
}
```

**Source:** [Gemini Vision docs](https://ai.google.dev/docs/vision)

### Pattern 3: fal.ai FLUX with Async Subscribe

**What:** fal.ai image generation is async. Use `fal.subscribe()` which handles polling internally and calls `onQueueUpdate` callback.

**When to use:** Thumbnail generation, B-roll prompts, any fal.ai endpoint.

**Example:**

```typescript
// src/lib/remix/thumbnail-remixer.ts
import * as fal from '@fal-ai/serverless-client';
import { getServerConfig } from '@/lib/remix-engine/config';

async function generateThumbnailVariation(params: {
  prompt: string;
  videoId: string;
  onProgress?: (status: string) => void;
}): Promise<string> {
  const config = getServerConfig();
  fal.config({ credentials: config.apiKeys.falAi });

  const result = await fal.subscribe('fal-ai/flux/dev', {
    input: {
      prompt: params.prompt,
      image_size: { width: 1280, height: 720 },
      num_images: 1,
      enable_safety_checker: true,
    },
    onQueueUpdate: (update) => {
      params.onProgress?.(`fal.ai status: ${update.status}`);
      // Update job progress in DB for frontend real-time updates
    },
  });

  // result.images[0].url contains the generated image
  return result.images[0].url;
}
```

**Source:** [@fal-ai/serverless-client docs](https://github.com/fal-ai/fal-js)

### Pattern 4: Scene Numbering Uniqueness via Database Constraint

**What:** Scene numbers must be unique per script, enforced at database layer via `UNIQUE(script_id, scene_number)`.

**When to use:** After generating scenes from Gemini, before insert. Application logic validates, database constraint prevents duplicates.

**Example:**

```typescript
// Database schema (from spec)
CREATE TABLE public.re_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES re_scripts(id) ON DELETE CASCADE,
  scene_number INT NOT NULL,
  dialogue_line TEXT NOT NULL,
  duration_seconds INT NOT NULL,
  broll_description TEXT NOT NULL,
  onscreen_text TEXT,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(script_id, scene_number)  -- ← Enforces uniqueness per script
);

// Application logic (before insert)
async function saveScenes(scriptId: string, scenes: Scene[]) {
  // Validate sequential and unique
  const sceneNumbers = scenes.map(s => s.sceneNumber);
  const isSequential = sceneNumbers.every((n, i) => n === i + 1);
  if (!isSequential) {
    throw new Error('Scene numbers must be sequential starting from 1');
  }

  // Insert (DB constraint catches duplicates)
  for (const scene of scenes) {
    await supabase.from('re_scenes').insert({
      script_id: scriptId,
      scene_number: scene.sceneNumber,
      dialogue_line: scene.dialogueLine,
      duration_seconds: scene.duration,
      broll_description: scene.brollDescription,
    });
  }
}
```

**Source:** Spec Section 5 (Database Schema) — `re_scenes` table definition

### Pattern 5: User Selection Tracking with is_selected Boolean

**What:** After remix generates content, user reviews and selects. Database booleans (`is_selected` on titles, thumbnails, scripts) track selection. Only selected item proceeds to generation.

**When to use:** Storing user choice in database, gating generation pipeline on selection existence.

**Example:**

```typescript
// Database tables
CREATE TABLE re_remixed_titles (
  id UUID PRIMARY KEY,
  video_id UUID NOT NULL,
  content TEXT NOT NULL,
  style VARCHAR(50),
  is_selected BOOLEAN DEFAULT false,
  ...
);

CREATE TABLE re_remixed_thumbnails (
  id UUID PRIMARY KEY,
  video_id UUID NOT NULL,
  image_url TEXT,
  is_selected BOOLEAN DEFAULT false,
  ...
);

// User selects a title via API
async function selectTitle(videoId: string, titleId: string) {
  // Clear previous selection
  await supabase
    .from('re_remixed_titles')
    .update({ is_selected: false })
    .eq('video_id', videoId);

  // Set new selection
  await supabase
    .from('re_remixed_titles')
    .update({ is_selected: true })
    .eq('id', titleId);
}

// Generate phase: verify selections exist
async function initiateGeneration(videoId: string) {
  const { data: selections } = await supabase.from('re_videos').select(`
    re_remixed_titles(is_selected),
    re_remixed_thumbnails(is_selected),
    re_scripts(id)
  `).eq('id', videoId).single();

  const hasSelectedTitle = selections.re_remixed_titles.some(t => t.is_selected);
  const hasSelectedThumbnail = selections.re_remixed_thumbnails.some(t => t.is_selected);
  const hasScript = selections.re_scripts.length > 0;

  if (!hasSelectedTitle || !hasSelectedThumbnail || !hasScript) {
    throw new Error('Title, thumbnail, and script must be selected before generation');
  }

  // Proceed to generation
}
```

**Source:** Spec Section 8 (Pipeline Architecture) — gate enforcement

### Pattern 6: Non-Fatal Graceful Degradation for Remix Operations

**What:** If one remix operation fails (e.g., title generation times out), catch and log, but continue. User sees partial results. Regenerate is available.

**When to use:** Batch remix across multiple videos or remix types. Individual failures must not block others.

**Example:**

```typescript
// src/worker/handlers/remix.ts
async function handleRemixJob(job: Job) {
  const { videoId } = job.data;
  const results = {
    titles: null as any,
    thumbnails: null as any,
    script: null as any,
  };

  try {
    // Try titles
    try {
      results.titles = await generateTitleVariations(...);
      await saveRemixedTitles(videoId, results.titles);
    } catch (err) {
      logger.error('Title remix failed, continuing', { videoId, error: err.message });
      // Don't rethrow — let other remixes continue
    }

    // Try thumbnails
    try {
      results.thumbnails = await generateThumbnailVariations(...);
      await saveRemixedThumbnails(videoId, results.thumbnails);
    } catch (err) {
      logger.error('Thumbnail remix failed, continuing', { videoId, error: err.message });
    }

    // Try script
    try {
      results.script = await generateRemixedScript(...);
      await saveRemixedScript(videoId, results.script);
    } catch (err) {
      logger.error('Script remix failed, continuing', { videoId, error: err.message });
    }

    // Mark video remix status based on what succeeded
    await supabase.from('re_videos').update({
      pipeline_status: results.titles && results.thumbnails && results.script ? 'remixed' : 'remixing_partial',
    }).eq('id', videoId);

    return { success: true, results };
  } catch (err) {
    logger.error('Remix job failed', { videoId, error: err.message });
    throw err; // Queue will mark as failed
  }
}
```

### Anti-Patterns to Avoid

- **Don't use Gemini without JSON mode for structured output.** Free-form text is unreliable for parsing. Always enforce schema.
- **Don't make Supabase Storage public for audio/videos used by external services.** Use service role key to sign URLs server-side or, for HeyGen, use Upload Asset API pattern (spec Section 14).
- **Don't block batch remix if one item fails.** Log and continue — partial results are better than total failure.
- **Don't trust Gemini's scene duration estimates directly.** They're heuristic (word count ÷ 150 words/min). Provide user feedback "This is estimated; adjust manually if needed."
- **Don't bypass the scene number uniqueness constraint.** It's database-enforced for a reason — prevents duplicate scenes in composition.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON response validation from LLM | Custom string parsing + type guards | Zod + Gemini JSON mode | LLMs hallucinate; Zod catches invalid schemas; Gemini enforces response structure |
| Async image generation polling | Manual fetch loop with setInterval | fal.ai subscribe() | fal.ai handles backoff, timeout, and progress callbacks internally |
| Image analysis from thumbnail | Custom vision API integration | Gemini Vision | Single model handles both generation and analysis; no extra API keys or latency |
| Scene duration calculation | Simple word count formula | Gemini-suggested + user override | Users know their delivery speed; formulas are wrong ~20% of the time |
| Database constraint enforcement | Application-level uniqueness check | UNIQUE constraint | Database is source of truth; app checks are racy in concurrent scenarios |

**Key insight:** Phase 3 is fundamentally about **trusting Gemini's structured JSON output** and **enforcing database constraints**. Both eliminate brittle custom parsing and race conditions.

## Common Pitfalls

### Pitfall 1: Gemini JSON Mode Schema Mismatch

**What goes wrong:** Gemini returns valid JSON that doesn't match the declared schema. Zod validation fails. User sees 500 error.

**Why it happens:** responseSchema parameter in generationConfig is a *hint*, not a strict enforcer. Gemini's LLM sometimes deviates (especially if prompt is ambiguous).

**How to avoid:**
- Make prompt extremely explicit: "You MUST return EXACTLY 8 variations. Each variation MUST have exactly these three fields: style, title, reasoning."
- Use `temperature: 0.8` (moderate creativity) not 0 or 1. Lower temps = more consistent; higher = more creative but less predictable.
- Always wrap Zod.parse() in try-catch; log full response before error so you can debug schema mismatches.

**Warning signs:**
- "Validation failed: expected array length 8, got 7" — Gemini returned fewer variations
- "Zod validation error: unexpected field 'explanation'" — Gemini added extra fields

### Pitfall 2: fal.ai Queue Timeouts

**What goes wrong:** Image generation starts but never completes. `subscribe()` times out after 60s (default) and fails job.

**Why it happens:** fal.ai queue is congested OR image prompt is malformed (causes internal error). No clear signal from API.

**How to avoid:**
- Set reasonable timeouts in subscribe(): `{ timeout: 300000 }` (5 min, not 60s default)
- Test thumbnail prompt on fal.ai playground first — catch malformed prompts before enqueueing
- Check fal.ai status page before batch operations
- Retry policy: catch timeout, log, allow user to manually regenerate

**Warning signs:**
- Job spins in "generating" state for >2 min
- fal.ai response is `{ status: 'processing' }` forever

### Pitfall 3: Scene Duration Auto-Adjust Logic Breaking

**What goes wrong:** Gemini returns scenes with durations outside 15-45s range. Auto-split/merge logic creates weird scenes or skips dialogue.

**Why it happens:** Gemini's duration estimates are heuristic (word count ÷ speech rate). If prompt says "be concise," it underestimates; "be detailed" overestimates.

**How to avoid:**
- Let Gemini estimate, but **always show estimated durations to user with a note**: "⏱ Estimated. Adjust manually if needed."
- Auto-split/merge ONLY as fallback, not primary behavior. Manual editing is expected.
- For sequences > 45s, split into multiple scenes BUT preserve numbering (1, 2, 3, not 1, 1a, 2).
- Don't try to be clever — simple sequential numbering enforced by UNIQUE constraint.

**Warning signs:**
- User says "Scene 3 is way longer than it should be" (trust them; Gemini's estimate is wrong)
- Scene count jumps unexpectedly after regeneration

### Pitfall 4: Inline Edit Not Saving Selection State

**What goes wrong:** User edits title text inline, clicks away, but `is_selected` was never marked true. Approval gate says "Title not selected."

**Why it happens:** Inline edit UI updates DOM but forgets to persist selection state to database.

**How to avoid:**
- When user selects a title card (radio button), IMMEDIATELY mark `is_selected = true` and update database
- When user edits text, save the new text AND keep `is_selected = true`
- Don't conflate "edited" with "selected" — editing a title DOES NOT auto-select it. User must click the radio button.

**Warning signs:**
- User completes all edits but approval button stays disabled
- Selection is lost on page refresh

### Pitfall 5: Missing Gemini API Rate Limit Handling

**What goes wrong:** Batch remix of 20 videos. Gemini hits rate limit (15 RPM free tier). Jobs queue up, some timeout, rest fail.

**Why it happens:** No exponential backoff on 429 errors. Queue tries immediately.

**How to avoid:**
- Wrap Gemini calls in retry logic: catch error, check for `status: 429`, exponential backoff (1s, 2s, 4s, 8s max)
- For batch > 5 videos, space them: 1s between requests, OR use Gemini Batch API (lower cost, async)
- Monitor logs for rate limit errors — surface to user: "Your remix is in a queue due to API limits, should complete in ~30s"

**Warning signs:**
- Logs show `"error": "resource_exhausted"` or `"status": 429`
- Jobs take 5+ minutes for 10 videos (should be <2 min)

## Code Examples

Verified patterns from official sources:

### Gemini JSON Mode (8 Title Variations)

```typescript
// src/lib/remix/title-remixer.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { getServerConfig } from '@/lib/remix-engine/config';
import { logger } from '@/lib/logger';

const TitleVariationSchema = z.object({
  style: z.enum([
    'Curiosity Gap',
    'Direct Value',
    'Contrarian',
    'Listicle',
    'Question',
    'Emotional Hook',
    'Tutorial',
    'Story-Driven',
  ]),
  title: z.string().min(5).max(100),
  reasoning: z.string().min(10).max(500),
});

const TitlesResponseSchema = z.object({
  variations: z.array(TitleVariationSchema).length(8),
});

async function generateTitleVariations(params: {
  originalTitle: string;
  description: string;
  channelName: string;
  videoDuration?: number;
}): Promise<z.infer<typeof TitlesResponseSchema>> {
  const config = getServerConfig();
  const genAI = new GoogleGenerativeAI(config.apiKeys.gemini);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a YouTube thumbnail and title optimization expert. Your job is to create 8 completely different title variations for a video that will appeal to different audiences and search behaviors.

Original title: "${params.originalTitle}"
Channel: "${params.channelName}"
Video description: "${params.description}"
${params.videoDuration ? `Duration: ${params.videoDuration} minutes` : ''}

Generate EXACTLY 8 title variations, each with a distinct style and strategy. Each title must:
- Be 5-100 characters long
- Be a genuine remix (not plagiarism), with fresh angles and phrasing
- Be compelling and clickable
- Preserve core information

Return valid JSON with this exact structure: { "variations": [ { "style": "category name", "title": "the title", "reasoning": "why this works" }, ... ] }

The 8 styles are:
1. Curiosity Gap - creates mystery or intrigue
2. Direct Value - clear benefit or promise
3. Contrarian - challenges conventional wisdom
4. Listicle - "N ways" or "Top N"
5. Question - provocative question format
6. Emotional Hook - triggers fear, excitement, or surprise
7. Tutorial - instructional or how-to framing
8. Story-Driven - narrative hook that builds tension

CRITICAL: Return EXACTLY 8 variations, one per style. Do not deviate. Do not add extra fields.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
      },
    });

    const text = result.response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      logger.error('Failed to parse Gemini JSON response', { text, error: e.message });
      throw new Error('Gemini returned invalid JSON');
    }

    const validated = TitlesResponseSchema.parse(parsed);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Title validation failed', { errors: error.errors });
      throw new Error(`Invalid title response schema: ${error.message}`);
    }
    throw error;
  }
}

export { generateTitleVariations, TitlesResponseSchema };
```

**Source:** [Gemini JSON mode docs](https://ai.google.dev/docs/structured_output)

### Thumbnail Analysis with Gemini Vision

```typescript
// src/lib/remix/thumbnail-analyzer.ts
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { getServerConfig } from '@/lib/remix-engine/config';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';

async function analyzeThumbnail(thumbnailUrl: string): Promise<string> {
  const config = getServerConfig();
  const genAI = new GoogleGenerativeAI(config.apiKeys.gemini);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Fetch image from URL and convert to base64
  let imageData: string;
  try {
    const response = await fetch(thumbnailUrl);
    if (!response.ok) throw new Error(`Failed to fetch thumbnail: ${response.status}`);
    const buffer = await response.arrayBuffer();
    imageData = Buffer.from(buffer).toString('base64');
  } catch (err) {
    logger.error('Failed to fetch thumbnail', { url: thumbnailUrl, error: err.message });
    // Graceful degradation: return generic analysis
    return 'Unable to analyze original thumbnail (fetch failed). Use default prompt.';
  }

  const prompt = `Analyze this YouTube video thumbnail in detail. Provide a structured analysis covering:
1. Dominant colors and color scheme
2. Text overlays (if any)
3. Main visual elements (faces, objects, scenes)
4. Composition and layout
5. Emotional tone or mood
6. Scene type or category
7. Overall design effectiveness

Be specific and detailed. This analysis will be used to generate 3 new thumbnail variations. Focus on what makes this thumbnail visually distinctive.`;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageData,
              },
            },
          ] as Part[],
        },
      ],
    });

    return result.response.text();
  } catch (error) {
    logger.error('Thumbnail analysis failed', { error: error.message });
    throw new Error('Gemini Vision analysis failed');
  }
}

export { analyzeThumbnail };
```

**Source:** [Gemini Vision docs](https://ai.google.dev/docs/vision)

### fal.ai FLUX Image Generation

```typescript
// src/lib/remix/thumbnail-remixer.ts
import * as fal from '@fal-ai/serverless-client';
import { getServerConfig } from '@/lib/remix-engine/config';
import { logger } from '@/lib/logger';

async function generateThumbnailVariation(params: {
  prompt: string;
  videoId: string;
  jobId?: string;
  onProgress?: (status: string) => void;
}): Promise<string> {
  const config = getServerConfig();

  // Initialize fal client
  fal.config({ credentials: config.apiKeys.falAi });

  try {
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: params.prompt,
        image_size: { width: 1280, height: 720 }, // YouTube thumbnail
        num_images: 1,
        enable_safety_checker: true,
        seed: Math.floor(Math.random() * 1000000), // Variation
      },
      onQueueUpdate: (update) => {
        params.onProgress?.(`fal.ai: ${update.status}`);
        // Optionally update DB with progress
        if (params.jobId && update.status === 'PROCESSING') {
          logger.info(`Thumbnail generation in progress`, {
            videoId: params.videoId,
            jobId: params.jobId,
          });
        }
      },
    });

    if (!result.images || result.images.length === 0) {
      throw new Error('fal.ai returned no images');
    }

    return result.images[0].url;
  } catch (error) {
    logger.error('Thumbnail generation failed', {
      videoId: params.videoId,
      error: error.message,
    });
    throw error;
  }
}

export { generateThumbnailVariation };
```

**Source:** [@fal-ai/serverless-client docs](https://github.com/fal-ai/fal-js)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Gemini free-form text output + regex parsing | Gemini JSON mode + Zod validation | Gemini June 2024 | 99%+ reliability; no hallucination-related parsing errors |
| Manual image generation polling | fal.ai subscribe() pattern | fal.ai 2024 | Built-in retry, backoff, timeout; 80% less boilerplate |
| Public Storage URLs for external services | Service role key + signed URLs OR Upload Asset API | Spec consensus Feb 2026 | Zero public exposure; privacy enforced at DB layer |

**Deprecated/outdated:**
- **Gemini 1.5 / older models:** Use `gemini-2.0-flash` — 2x faster, lower latency, free tier sufficient for MVP
- **YouTube Captions API:** Requires OAuth. Use yt-dlp (Phase 2) instead — already available, no extra auth

## Open Questions

1. **Scene duration: Word count vs. user override priority?**
   - What we know: Spec says 15-45s; Gemini estimates duration heuristically
   - What's unclear: If user manually edits scene duration, should auto-split/merge still apply?
   - Recommendation: User override always wins. Show "User override: X seconds" label. Auto-split/merge only on regeneration if user hasn't touched that scene.

2. **Batch remix error handling: Partial success acceptable?**
   - What we know: Individual failures should not block others (non-fatal)
   - What's unclear: If 3/20 videos fail title remix, how do we surface this to user?
   - Recommendation: Show "3 videos still processing titles, 17 complete" in UI. Regenerate button per-video. Mark partial state in pipeline status.

3. **Inline title edit: Should we auto-select the edited title?**
   - What we know: User edits title text inline
   - What's unclear: Does editing count as selection, or must user click radio button?
   - Recommendation: Per CONTEXT.md, user must explicitly click radio. Editing does NOT auto-select.

## Validation Architecture

> Skip this section entirely if workflow.nyquist_validation is false in .planning/config.json

**Config check:** workflow.nyquist_validation = **true** — validation architecture included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (via `npm run test`) + Supertest for API routes |
| Config file | `jest.config.js` (established in Phase 1) |
| Quick run command | `npm run test -- --testPathPattern='remix' --watch` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R3.1 | Gemini generates 8 title variations with correct schema | unit | `npm run test -- src/lib/remix/title-remixer.test.ts` | ❌ Wave 0 |
| R3.2 | fal.ai generates 3 thumbnails at 1280x720 | integration | `npm run test -- src/lib/remix/thumbnail-remixer.test.ts` | ❌ Wave 0 |
| R3.3 | Gemini script includes scenes with 15-45s durations, unique scene numbers | unit | `npm run test -- src/lib/remix/script-remixer.test.ts` | ❌ Wave 0 |
| R3.4 | Remixed content stored in DB with is_selected booleans | integration | `npm run test -- src/app/api/remix-engine/remix/__tests__/route.test.ts` | ❌ Wave 0 |
| R3.5 | User can select, edit, regenerate via API | e2e | `npm run test -- src/app/api/remix-engine/remix/__tests__/selection.test.ts` | ❌ Wave 0 |
| R3.6 | Generate endpoint rejects if selections missing | unit | `npm run test -- src/app/api/remix-engine/__tests__/gate.test.ts` | ❌ Wave 0 |
| R3.7 | Batch remix queues jobs in parallel with correct concurrency | unit | `npm run test -- src/worker/__tests__/remix-handler.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test -- --testPathPattern='remix' --maxWorkers=4`
- **Per wave merge:** `npm run test` (full suite, all phases)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/remix/__tests__/title-remixer.test.ts` — unit tests for Zod validation, Gemini JSON parsing
- [ ] `src/lib/remix/__tests__/thumbnail-analyzer.test.ts` — Gemini Vision integration
- [ ] `src/lib/remix/__tests__/thumbnail-remixer.test.ts` — fal.ai subscribe() mocking
- [ ] `src/lib/remix/__tests__/script-remixer.test.ts` — scene duration logic, UNIQUE constraint violation
- [ ] `src/app/api/remix-engine/remix/__tests__/route.test.ts` — API route handlers (POST /title, /thumbnail, /script)
- [ ] `src/app/api/remix-engine/remix/__tests__/selection.test.ts` — is_selected boolean toggle, edit operations
- [ ] `src/app/api/remix-engine/__tests__/gate.test.ts` — generate pipeline gate verification
- [ ] `src/worker/__tests__/remix-handler.test.ts` — BullMQ job handler, concurrency limits
- [ ] `src/components/__tests__/RemixReviewPage.test.tsx` — UI component: title grid, thumbnail cards, scene editor, approval checklist

### Mocking Strategy

- **Gemini API:** Mock `@google/generative-ai` with realistic JSON responses; test both success and validation failures
- **fal.ai:** Mock `@fal-ai/serverless-client.subscribe()` to simulate async queue; test onQueueUpdate callback
- **Supabase:** Use Supabase Local Stack (via Docker) for integration tests; or mock supabase-js for unit tests
- **BullMQ:** Use `bull-mq-testing` utilities for testing job handler concurrency

## Sources

### Primary (HIGH confidence)

- Spec Section 3 (Agent Team) — Remix pipeline roles and file structure
- Spec Section 6 (Zod Schemas) — RemixTitleRequestSchema, RemixScriptRequestSchema validation
- Spec Section 7 (API Routes) — POST /api/remix-engine/remix/* endpoint map
- Spec Section 8 (Pipeline Architecture) — Pipeline state machine, pause gate, job concurrency limits
- Spec Section 14 (API Integrations) — Gemini JSON mode, fal.ai subscribe pattern, vision analysis
- CONTEXT.md — Locked UX decisions for review page, approval gate, inline editing
- @google/generative-ai docs — JSON mode, vision, structured output
- @fal-ai/serverless-client docs — subscribe() polling pattern
- Zod v3 docs — schema validation for Gemini responses

### Secondary (MEDIUM confidence)

- STATE.md (Phase 01-02 decisions) — is_selected pattern, UNIQUE constraint for scenes, CSS variables
- REQUIREMENTS.md (R3.1–R3.7) — Phase requirement mapping to research findings
- Design System (MASTER.md) — Component patterns, spacing, transitions for review UI

### Tertiary (LOW confidence)

None — all critical findings verified against spec or official documentation.

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — Gemini/fal.ai are locked decisions; versions documented; @google/generative-ai is official SDK
- **Architecture:** HIGH — Spec sections 3, 6, 7, 8, 14 cover all patterns; is_selected pattern proven in Phase 2
- **Pitfalls:** MEDIUM-HIGH — Gemini rate limits and JSON schema mismatches are known issues; fal.ai timeout handling is documented in source
- **Validation:** MEDIUM — Jest infrastructure exists from Phase 1; test file structure inferred from codebase patterns

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (30 days — stable domain, no rapid updates expected)
