# RemixEngine Design System — MASTER Token Reference

> UUPM Design System — generated for RemixEngine v1.0
> Product: RemixEngine — YouTube content remixing SaaS dashboard
> Aesthetic: Dark-first, Linear/Vercel — minimal, precise, dark
> CSS Variable Prefix: `--re-` (ALL tokens)
> Component Base: shadcn/ui
> Color Space: HSL values throughout

---

## Design Principles

1. **Dark-first, not dark-toggled.** The application defaults to dark mode. Light mode is not designed or supported.
2. **Minimal surface area.** Borders are subtle. Backgrounds differentiate hierarchy, not decoration.
3. **Precision over decoration.** Motion is purposeful (150–200ms). No unnecessary shadows or gradients.
4. **Linear/Vercel aesthetic.** Inspired by Linear.app and Vercel dashboard: muted dark backgrounds, crisp blue accents, generous whitespace.

---

## 1. Color Tokens

All colors are defined as HSL values. Never use hex in components — always reference a CSS variable.

### Background Colors

| Token | Value | Usage |
|---|---|---|
| `--re-bg-primary` | `hsl(240 10% 3.9%)` | Main application background (deepest dark) |
| `--re-bg-secondary` | `hsl(240 5% 8%)` | Cards, panels, modals — one step lighter |
| `--re-bg-sidebar` | `hsl(240 6% 6%)` | Sidebar background — slightly different from main |
| `--re-bg-hover` | `hsl(240 5% 12%)` | Interactive hover state for nav items, list rows |
| `--re-bg-active` | `hsl(240 5% 15%)` | Active/selected state background |
| `--re-bg-input` | `hsl(240 5% 10%)` | Form input background |
| `--re-bg-tooltip` | `hsl(240 8% 18%)` | Tooltip background |

### Accent Colors

| Token | Value | Usage |
|---|---|---|
| `--re-accent-primary` | `hsl(217 91% 60%)` | Primary CTA, active nav indicator, links, focus rings |
| `--re-accent-secondary` | `hsl(217 91% 50%)` | Hover state for primary accent elements |
| `--re-accent-primary-subtle` | `hsl(217 91% 60% / 0.12)` | Accent background behind active nav item |
| `--re-accent-primary-border` | `hsl(217 91% 60% / 0.35)` | Accent-tinted border for active states |

### Text Colors

| Token | Value | Usage |
|---|---|---|
| `--re-text-primary` | `hsl(0 0% 98%)` | Primary text — headings, labels, active nav items |
| `--re-text-secondary` | `hsl(240 5% 84%)` | Body text, descriptions |
| `--re-text-muted` | `hsl(240 5% 64.9%)` | Placeholder text, timestamps, secondary metadata |
| `--re-text-disabled` | `hsl(240 5% 40%)` | Disabled state text |
| `--re-text-inverse` | `hsl(240 10% 4%)` | Text on light/accent backgrounds |

### Border Colors

| Token | Value | Usage |
|---|---|---|
| `--re-border` | `hsl(240 3.7% 15.9%)` | Default border — card edges, input outlines |
| `--re-border-subtle` | `hsl(240 3.7% 12%)` | De-emphasized borders — dividers inside panels |
| `--re-border-strong` | `hsl(240 3.7% 20%)` | Strong borders — modal outlines, focus rings |

### Semantic / Status Colors

| Token | Value | Usage |
|---|---|---|
| `--re-destructive` | `hsl(0 72% 51%)` | Danger, errors, delete actions |
| `--re-destructive-foreground` | `hsl(0 0% 98%)` | Text on destructive backgrounds |
| `--re-success` | `hsl(142 71% 45%)` | Success states, completed jobs |
| `--re-warning` | `hsl(38 92% 50%)` | Warning states, pending approval |
| `--re-info` | `hsl(217 91% 60%)` | Informational — same as accent primary |

---

## 2. Spacing & Sizing Tokens

| Token | Value | Usage |
|---|---|---|
| `--re-sidebar-width` | `240px` | Expanded sidebar width |
| `--re-sidebar-width-collapsed` | `64px` | Collapsed icon-rail sidebar width |
| `--re-header-height` | `56px` | Top header bar height |
| `--re-panel-padding` | `1.5rem` | Inner padding for cards and panels (24px) |
| `--re-nav-item-height` | `36px` | Height of a single sidebar nav item |
| `--re-nav-item-padding` | `0 12px` | Horizontal padding inside nav items |
| `--re-input-height` | `36px` | Standard form input height |
| `--re-border-radius` | `6px` | Default border radius for components |
| `--re-border-radius-sm` | `4px` | Smaller radius — tags, badges |
| `--re-border-radius-lg` | `10px` | Larger radius — modals, dialogs |

---

## 3. Typography Tokens

### Font Families

| Token | Value | Usage |
|---|---|---|
| `--re-font-sans` | `var(--font-geist-sans, Inter, system-ui, sans-serif)` | Default body and UI text |
| `--re-font-mono` | `var(--font-geist-mono, 'Fira Code', monospace)` | Code, IDs, timestamps |

### Font Sizes

| Token | Value | Usage |
|---|---|---|
| `--re-text-xs` | `0.75rem` | 12px — metadata, badges, timestamps |
| `--re-text-sm` | `0.875rem` | 14px — body text, nav labels, descriptions |
| `--re-text-base` | `1rem` | 16px — standard readable content |
| `--re-text-lg` | `1.125rem` | 18px — section headings |
| `--re-text-xl` | `1.25rem` | 20px — page titles |
| `--re-text-2xl` | `1.5rem` | 24px — dashboard metric callouts |

### Font Weights

| Token | Value | Usage |
|---|---|---|
| `--re-font-normal` | `400` | Body text |
| `--re-font-medium` | `500` | Nav labels, button text, form labels |
| `--re-font-semibold` | `600` | Headings, active nav, metric values |

---

## 4. Transition Tokens

| Token | Value | Usage |
|---|---|---|
| `--re-transition-fast` | `150ms ease` | Hover states, focus rings — immediate feedback |
| `--re-transition-base` | `200ms ease` | Sidebar collapse, panel open/close |
| `--re-transition-slow` | `300ms ease` | Modals, large panel transitions |

---

## 5. Shadow Tokens

| Token | Value | Usage |
|---|---|---|
| `--re-shadow-sm` | `0 1px 2px hsl(240 10% 2% / 0.5)` | Subtle lift for cards |
| `--re-shadow-md` | `0 4px 12px hsl(240 10% 2% / 0.6)` | Elevated panels, dropdowns |
| `--re-shadow-lg` | `0 8px 24px hsl(240 10% 2% / 0.7)` | Modals, dialogs |

---

## 6. Component Specifications

### Sidebar

The sidebar is the primary navigation surface. It collapses to an icon rail.

**Dimensions:**
- Expanded: `var(--re-sidebar-width)` = 240px
- Collapsed: `var(--re-sidebar-width-collapsed)` = 64px
- Full height, fixed position

**Colors:**
- Background: `var(--re-bg-sidebar)` — `hsl(240 6% 6%)`
- Right edge border: 1px solid `var(--re-border-subtle)`
- Logo area height: same as `var(--re-header-height)` = 56px

**States:**
- Transition: `width var(--re-transition-base)` — 200ms ease
- Transition applies to: sidebar width, icon label fade, text opacity

**Structure (top to bottom):**
```
[Logo / App Name]    ← fixed 56px height, matches header
[Nav Section: Main]
  - Projects         (icon: FolderOpen)
  - Queue            (icon: ListTodo)
  - Analytics        (icon: BarChart3)
[Spacer: flex-grow]
[Nav Section: Bottom]
  - Admin            (icon: Shield)
  - Settings         (icon: Settings)
[User Avatar]        ← pinned to bottom, 56px height
```

**Collapsed state:**
- Show only icons, centered
- No text labels visible
- Tooltips appear on hover showing the label
- Logo area: show icon only

**Mode gate:** Sidebar only renders when `config.mode === 'standalone'`

---

### Nav Item

A single navigation link in the sidebar.

| State | Background | Text color | Icon color |
|---|---|---|---|
| Default | transparent | `var(--re-text-secondary)` | `var(--re-text-muted)` |
| Hover | `var(--re-bg-hover)` | `var(--re-text-primary)` | `var(--re-text-secondary)` |
| Active | `var(--re-accent-primary-subtle)` | `var(--re-accent-primary)` | `var(--re-accent-primary)` |

**Sizing:**
- Height: `var(--re-nav-item-height)` = 36px
- Padding: `var(--re-nav-item-padding)` = 0 12px
- Border radius: `var(--re-border-radius)` = 6px
- Icon size: 18px
- Gap between icon and label: 10px
- Transition: `background var(--re-transition-fast)`, `color var(--re-transition-fast)`

**Active indicator:** Left accent bar, 2px wide, `var(--re-accent-primary)`, full item height. Or: background tint using `var(--re-accent-primary-subtle)`.

---

### Header Bar

Top-level application header. Always 56px tall.

- Background: `var(--re-bg-primary)` — matches main background (flush look)
- Bottom border: 1px solid `var(--re-border-subtle)`
- Height: `var(--re-header-height)` = 56px
- Contains: page title (left), action buttons (right), user avatar (far right)
- Mode gate: Only renders in standalone mode

---

### Card / Panel

Container for content sections.

- Background: `var(--re-bg-secondary)` = `hsl(240 5% 8%)`
- Border: 1px solid `var(--re-border)`
- Border radius: `var(--re-border-radius-lg)` = 10px
- Padding: `var(--re-panel-padding)` = 1.5rem
- Shadow: `var(--re-shadow-sm)`

---

### Avatar

Circular user avatar with fallback initials.

- Size: 32px (small), 36px (nav), 40px (large)
- Background fallback: `var(--re-accent-primary-subtle)`
- Text color fallback: `var(--re-accent-primary)`
- Border: 1px solid `var(--re-border-subtle)`
- Border radius: 50%

---

### Button — Primary

- Background: `var(--re-accent-primary)` = `hsl(217 91% 60%)`
- Text: `var(--re-text-inverse)` = `hsl(240 10% 4%)`
- Hover background: `var(--re-accent-secondary)` = `hsl(217 91% 50%)`
- Border: none
- Border radius: `var(--re-border-radius)` = 6px
- Height: `var(--re-input-height)` = 36px
- Padding: 0 16px
- Font weight: `var(--re-font-medium)` = 500

### Button — Secondary / Ghost

- Background: transparent
- Text: `var(--re-text-secondary)`
- Border: 1px solid `var(--re-border)`
- Hover background: `var(--re-bg-hover)`
- Hover text: `var(--re-text-primary)`

### Button — Destructive

- Background: `var(--re-destructive)` = `hsl(0 72% 51%)`
- Text: `var(--re-destructive-foreground)`
- Hover: darken 10%

---

### Form Input

- Background: `var(--re-bg-input)` = `hsl(240 5% 10%)`
- Border: 1px solid `var(--re-border)`
- Border radius: `var(--re-border-radius)` = 6px
- Height: `var(--re-input-height)` = 36px
- Text: `var(--re-text-primary)`
- Placeholder: `var(--re-text-muted)`
- Focus border: `var(--re-accent-primary)`
- Focus ring: `0 0 0 2px var(--re-accent-primary-border)`

---

### Tooltip

- Background: `var(--re-bg-tooltip)` = `hsl(240 8% 18%)`
- Text: `var(--re-text-primary)`
- Border: 1px solid `var(--re-border)`
- Border radius: `var(--re-border-radius-sm)` = 4px
- Padding: 4px 8px
- Font size: `var(--re-text-xs)` = 12px
- Shadow: `var(--re-shadow-md)`
- Delay: 300ms before show

---

## 7. Page Layout Pattern

```
┌─────────────────────────────────────────────────┐
│  HEADER (56px, full width)                       │
├──────────────┬──────────────────────────────────┤
│              │                                   │
│   SIDEBAR    │          MAIN CONTENT             │
│  (240/64px)  │         (flex-1)                  │
│              │                                   │
│              │                                   │
└──────────────┴──────────────────────────────────┘
```

Main content area: `min-h-[calc(100vh-var(--re-header-height))]`, `ml-[var(--re-sidebar-width)]` (or `--re-sidebar-width-collapsed` when collapsed), `p-6` padding.

---

## 8. Navigation Structure

```
Main nav (top section):
  - /projects       Projects        FolderOpen
  - /queue          Queue           ListTodo
  - /analytics      Analytics       BarChart3

Bottom nav (pinned to bottom):
  - /admin          Admin           Shield
  - /settings       Settings        Settings2
```

All route links use `config.routePrefix` prefix: `${config.routePrefix}/projects`, etc.

---

## 9. Pipeline Status Colors

For displaying job pipeline states in the Queue view:

| Status | Color token | Visual |
|---|---|---|
| `queued` | `--re-text-muted` | Neutral gray |
| `processing` | `--re-accent-primary` | Blue (in progress) |
| `awaiting_approval` | `--re-warning` | Amber (needs action) |
| `completed` | `--re-success` | Green |
| `failed` | `--re-destructive` | Red |

---

## 10. Usage Rules (Non-Negotiable)

1. **Never use hex colors in components.** All colors must reference a `--re-*` CSS variable.
2. **Never hardcode pixel values for sidebar/header dimensions.** Always use the token variables.
3. **Tailwind color utilities must use `--color-re-*` mapped tokens** (defined in `@theme inline` in globals.css), e.g., `bg-re-bg-primary`, `text-re-accent-primary`.
4. **Dark mode is always on.** No light mode toggling. `@custom-variant dark (&:is(.dark *))` is set for shadcn/ui compatibility — next-themes sets `.dark` class on `<html>`.
5. **Transitions on interactive elements:** Always use `transition-[background,color]` with `--re-transition-fast` duration.
6. **Sidebar mode gate:** Only render `<Sidebar>` and `<Header>` when `config.mode === 'standalone'`.
