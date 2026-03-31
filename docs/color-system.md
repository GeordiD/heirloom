# Color System

This project uses **Tailwind semantic color utilities** that automatically handle light/dark mode transitions. Use these instead of raw CSS variable references or manual `dark:` variants.

## Text Colors

- `text-foreground` — Primary text (headings, main content)
- `text-muted-foreground` — Secondary text (labels, descriptions, empty states)
- `text-primary` — Brand accent text (links, "View Recipe →", action labels)

## Background Colors

- `bg-background` — Page background (set on `body`, rarely needed directly)
- `bg-card` — Surface background (nav bar, cards, overlays)
- `bg-accent` — Hover/chip background (icon hover states, toggle buttons, badges)
- `bg-muted` — Subtle fill (secondary sections, muted regions)

## Border Colors

- `border-border` — All borders (nav dividers, card outlines, button borders)

## Brand Tints

- `bg-lagoon/N` — Lagoon tint at opacity N (e.g. `selection:bg-lagoon/24`)

## Semantic State Colors

- `text-destructive` / `bg-destructive` — Error/delete states

## ❌ Avoid Raw CSS Variable References

Don't use raw CSS variable references in Tailwind classes:

```tsx
// ❌ Don't do this
<h1 className="text-[var(--sea-ink)]">Title</h1>
<p className="text-[var(--sea-ink-soft)]">Description</p>
<nav className="bg-[var(--surface)] border-[var(--chip-line)]">...</nav>

// ✅ Do this instead
<h1 className="text-foreground">Title</h1>
<p className="text-muted-foreground">Description</p>
<nav className="bg-card border-border">...</nav>
```

## How It Works

The anise palette vars (defined in `src/styles.css`) are the raw color primitives:

| Primitive var    | Light                    | Dark                     |
| ---------------- | ------------------------ | ------------------------ |
| `--sea-ink`      | `#173a40`                | `#d7ece8`                |
| `--sea-ink-soft` | `#416166`                | `#afcdc8`                |
| `--lagoon-deep`  | `#328f97`                | `#8de5db`                |
| `--lagoon`       | `#4fb8b2`                | `#60d7cf`                |
| `--surface`      | `rgba(255,255,255,0.74)` | `rgba(16,30,34,0.8)`     |
| `--chip-bg`      | `rgba(255,255,255,0.8)`  | `rgba(13,28,32,0.9)`     |
| `--chip-line`    | `rgba(23,58,64,0.14)`    | `rgba(141,229,219,0.24)` |
| `--bg-base`      | `#e7f3ec`                | `#0a1418`                |

The shadcn semantic vars reference the primitives, and Tailwind's `@theme inline` exposes them as utilities:

| Tailwind utility        | Shadcn var           | Primitive        |
| ----------------------- | -------------------- | ---------------- |
| `text-foreground`       | `--foreground`       | `--sea-ink`      |
| `text-muted-foreground` | `--muted-foreground` | `--sea-ink-soft` |
| `text-primary`          | `--primary`          | `--lagoon-deep`  |
| `bg-card`               | `--card`             | `--surface`      |
| `bg-accent`             | `--accent`           | `--chip-bg`      |
| `border-border`         | `--border`           | `--chip-line`    |
| `bg-background`         | `--background`       | `--bg-base`      |
| `bg-lagoon`             | —                    | `--lagoon`       |

Dark mode is automatic — switching to the `.dark` class updates the primitive vars, and all semantic utilities follow.

## Dark Mode Implementation

- **Toggle**: `ThemeToggle` component in the nav bar — cycles light → dark → auto
- **Default**: System preference (`auto`)
- **Persistence**: Stored in `localStorage` under key `theme`
- **Flash prevention**: Inline script in `__root.tsx` applies the theme class before first paint
