---
status: testing
phase: 03-remix-pipeline-4-hours
source: [03-00-SUMMARY.md, 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md]
started: 2026-02-27T07:10:00Z
updated: 2026-02-27T07:10:00Z
---

## Current Test

<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Pipeline Tabs on Video Detail Page
expected: |
  Navigate to a project video's detail page.
  You should see 3 pipeline stage tabs: "Scraping", "Remix Review", and "Generation".
  The active tab reflects the current pipeline stage. Tabs for future stages appear locked (dimmed/disabled). Completed stages appear visually distinct.
awaiting: user response

## Tests

### 1. Pipeline Tabs on Video Detail Page
expected: Navigate to a project video's detail page. You should see 3 pipeline stage tabs: "Scraping", "Remix Review", and "Generation". The active tab reflects the current pipeline stage. Tabs for future stages appear locked (dimmed/disabled). Completed stages appear visually distinct.
result: [pending]

### 2. Start Remix Button
expected: On the video detail page, a "Start Remix" button is visible. Clicking it fires all 3 remix requests (title, thumbnail, script) in parallel. After clicking, you should be navigated to the Remix Review tab/page automatically.
result: [pending]

### 3. Remix Review Page Loading States
expected: After triggering remix, navigating to the Remix Review page shows a loading/processing state while remix jobs are running. Once complete, the page transitions to show the remix content (titles, thumbnails, scenes). If still pending, an appropriate "processing" message is displayed.
result: [pending]

### 4. Eight Title Variations Displayed
expected: On the Remix Review page (after remix completes), you see exactly 8 title cards arranged in a 2-column grid. Each card shows a title variation. All 8 titles are visible without scrolling or are accessible by scrolling the title section.
result: [pending]

### 5. Title Selection
expected: Clicking a title card selects it — it gets a highlighted border or visual accent. Only one title can be selected at a time (selecting another deselects the previous). An inline textarea/edit field appears on the selected card for customization.
result: [pending]

### 6. Title Inline Editing
expected: After selecting a title card, an inline textarea appears showing the title text. You can edit it. A character count indicator shows remaining characters (max 100). Changes are saved when you blur/leave the field.
result: [pending]

### 7. Three Thumbnail Variations Displayed
expected: The Remix Review page shows 3 thumbnail images in a responsive grid (1 column on mobile, 3 columns on wider screens). Each thumbnail is loaded from a signed URL and displays the AI-generated image.
result: [pending]

### 8. Thumbnail Selection
expected: Clicking a thumbnail card selects it — a visual overlay or border accent appears on the selected thumbnail. Only one thumbnail can be selected at a time.
result: [pending]

### 9. Scene List Displayed
expected: The remix review page shows the remixed script as a list of scene cards stacked vertically. Each card shows a scene number badge and a duration badge (e.g., "~30s"). The scene dialogue text is visible.
result: [pending]

### 10. Scene Inline Editing
expected: Clicking on a scene's dialogue text opens an inline textarea for editing. After typing changes and clicking away (blur), the changes are saved via the API. The card returns to display mode showing the updated text.
result: [pending]

### 11. Approval Gate Checklist
expected: A sticky bar is visible at the bottom of the remix review page (or prominently placed) showing 3 checklist items: "Title selected", "Thumbnail selected", and "Script reviewed". Each item shows a filled checkmark icon when satisfied, or an empty circle when not yet done.
result: [pending]

### 12. Approve Button Disabled Until All Selected
expected: The "Approve" button in the approval gate is disabled (grayed out, not clickable) while any of the 3 checklist items are not satisfied. Once title, thumbnail, and script are all selected/reviewed, the button becomes active.
result: [pending]

### 13. Approval Confirmation Dialog
expected: When all 3 items are satisfied and you click "Approve", a confirmation dialog appears summarizing your selections (showing the selected title, selected thumbnail reference, and scene count). Confirming in the dialog triggers the approve action.
result: [pending]

### 14. Pipeline Gate After Approval
expected: After approving, the Generation stage tab in the pipeline navigation should unlock (no longer locked/dimmed), indicating the video is ready for the generation pipeline. The Remix Review tab shows a "complete" or approved state.
result: [pending]

## Summary

total: 14
passed: 0
issues: 0
pending: 14
skipped: 0

## Gaps

[none yet]
