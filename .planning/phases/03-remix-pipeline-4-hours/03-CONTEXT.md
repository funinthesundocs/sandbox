# Phase 3: Remix Pipeline - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

AI-generate remix content from scraped video data: 8 title variations, 3 thumbnail variations, and a scene-split remixed script. Users review, select, edit, and optionally regenerate any content before approving. Pipeline PAUSES after remix — generation does not start until user explicitly approves selections. Batch remix (all videos in a project) is also in scope.

</domain>

<decisions>
## Implementation Decisions

### Review page layout
- Single scrollable page — titles, thumbnails, and script all visible without tabs or steps
- 8 title variations displayed in a 2-column grid of radio-style selectable cards; each card shows the title text and its category label (e.g. "Clickbait", "SEO", "Question")
- 3 thumbnail variations displayed as large image cards side-by-side; collapses to stack on mobile
- Script displayed as stacked scene cards; each card shows scene number, estimated duration (derived from word count, 15–45s range), and script text

### Selection & inline editing
- Selected title card becomes inline-editable in-place — user can tweak the AI text before approving
- Scene script text is inline-editable on click (becomes textarea, saves on blur)
- Scene cards show: scene number, estimated duration, and script text only (no on-screen text field, no scene type tag in this phase)

### Regeneration controls
- **Titles:** Per-title regenerate icon on each card — replaces just that one variation
- **Thumbnails:** Per-thumbnail regenerate icon on each card, plus an optional style prompt input (user can type e.g. "darker, more dramatic") that applies to that regeneration
- **Script:** Both options — per-scene regenerate icon on each scene card, plus a full-script regenerate button at the top of the script section
- Loading state during regeneration: skeleton/shimmer on the specific item being regenerated; rest of page stays interactive

### Approval gate UX
- Sticky checklist/progress bar at the top of the review page: ✓ Title selected / ✓ Thumbnail selected / ○ Script reviewed — Approve button is disabled until all three are checked
- Clicking Approve opens a confirmation dialog summarizing selections: title text, thumbnail number, scene count — user confirms to trigger generation pipeline
- Video detail page uses a pipeline tab pattern: Scraping → Remix Review (active during this phase) → Generation (locked until approved)
- Post-approve but pre-generation: user can still return and revise selections if generation has not yet started; once generation begins, selections are locked

### Claude's Discretion
- Exact visual design of the sticky checklist (height, position, animation)
- How "script reviewed" is determined (e.g., user scrolled past all scenes, or simply having a script present counts)
- Exact style prompt UI placement for thumbnail regeneration
- Character count display for inline title editing

</decisions>

<specifics>
## Specific Ideas

- No specific references given — open to clean, functional defaults consistent with the existing design system
- The approval confirmation dialog should feel decisive, not scary — show what's been selected, not a warning

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-remix-pipeline-4-hours*
*Context gathered: 2026-02-27*
