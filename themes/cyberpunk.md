# Cyberpunk Theme

> **TL;DR:** A cyberpunk-inspired theme with neon accents, dark backgrounds, and holographic effects. Based on the New York theme structure with custom color values optimized for futuristic UI aesthetics.

## Metadata

- **Name:** Cyberpunk
- **Base Theme:** Default (New York)
- **Created:** 2026-04-26
- **Status:** Complete
- **Description:** Dark cyberpunk theme with neon cyan, magenta, and lime accents

## Core Variables

| Variable | Light Mode | Dark Mode | Purpose | Source |
|----------|------------|-----------|---------|--------|
| `--background` | `oklch(0.98 0.02 261)` / `#fafafa` | `oklch(0.15 0.02 261)` / `#0a0a0f` | Page background | shadcn |
| `--foreground` | `oklch(0.15 0.02 261)` / `#0f0f23` | `oklch(0.98 0.00 0)` / `#fafafa` | Primary text | shadcn |
| `--card` | `oklch(1.00 0.00 0)` / `#ffffff` | `oklch(0.18 0.02 261)` / `#1a1a2e` | Card backgrounds | shadcn |
| `--card-foreground` | `oklch(0.15 0.02 261)` / `#0f0f23` | `oklch(0.98 0.00 0)` / `#fafafa` | Card text | shadcn |
| `--popover` | `oklch(1.00 0.00 0)` / `#ffffff` | `oklch(0.18 0.02 261)` / `#1a1a2e` | Popover backgrounds | shadcn |
| `--popover-foreground` | `oklch(0.15 0.02 261)` / `#0f0f23` | `oklch(0.98 0.00 0)` / `#fafafa` | Popover text | shadcn |
| `--primary` | `oklch(0.70 0.20 195)` / `#00ffff` | `oklch(0.70 0.20 195)` / `#00ffff` | Neon cyan primary | special-case |
| `--primary-foreground` | `oklch(0.00 0.00 0)` / `#000000` | `oklch(0.00 0.00 0)` / `#000000` | Primary button text | shadcn |
| `--secondary` | `oklch(0.65 0.25 320)` / `#ff00ff` | `oklch(0.65 0.25 320)` / `#ff00ff` | Neon magenta secondary | special-case |
| `--secondary-foreground` | `oklch(0.00 0.00 0)` / `#000000` | `oklch(0.00 0.00 0)` / `#000000` | Secondary button text | shadcn |
| `--muted` | `oklch(0.94 0.02 261)` / `#f1f1f5` | `oklch(0.22 0.02 261)` / `#2a2a3e` | Muted backgrounds | shadcn |
| `--muted-foreground` | `oklch(0.40 0.01 261)` / `#64648c` | `oklch(0.70 0.01 261)` / `#b4b4d1` | Muted text | shadcn |
| `--accent` | `oklch(0.75 0.15 120)` / `#a3e635` | `oklch(0.25 0.02 261)` / `#3a3a4f` | Neon lime accent | special-case |
| `--accent-foreground` | `oklch(0.00 0.00 0)` / `#000000` | `oklch(0.98 0.00 0)` / `#fafafa` | Accent text | shadcn |
| `--destructive` | `oklch(0.60 0.20 25)` / `#ef4444` | `oklch(0.45 0.20 25)` / `#dc2626` | Error/danger | shadcn |
| `--destructive-foreground` | `oklch(0.98 0.00 0)` / `#fafafa` | `oklch(0.98 0.00 0)` / `#fafafa` | Error text | shadcn |
| `--border` | `oklch(0.90 0.02 261)` / `#e4e4e7` | `oklch(0.25 0.02 261)` / `#3a3a4f` | Border color | shadcn |
| `--input` | `oklch(0.90 0.02 261)` / `#e4e4e7` | `oklch(0.25 0.02 261)` / `#3a3a4f` | Input borders | shadcn |
| `--ring` | `oklch(0.70 0.20 195)` / `#00ffff` | `oklch(0.70 0.20 195)` / `#00ffff` | Focus rings | special-case |

## Chart Variables

| Variable | Light Mode | Dark Mode | Purpose | Source |
|----------|------------|-----------|---------|--------|
| `--chart-1` | `oklch(0.70 0.20 195)` / `#00ffff` | `oklch(0.70 0.20 195)` / `#00ffff` | Chart color 1 (cyan) | special-case |
| `--chart-2` | `oklch(0.65 0.25 320)` / `#ff00ff` | `oklch(0.65 0.25 320)` / `#ff00ff` | Chart color 2 (magenta) | special-case |
| `--chart-3` | `oklch(0.75 0.15 120)` / `#a3e635` | `oklch(0.75 0.15 120)` / `#a3e635` | Chart color 3 (lime) | special-case |
| `--chart-4` | `oklch(0.65 0.20 270)` / `#a855f7` | `oklch(0.65 0.20 270)` / `#a855f7` | Chart color 4 (purple) | special-case |
| `--chart-5` | `oklch(0.60 0.20 25)` / `#ef4444` | `oklch(0.60 0.20 25)` / `#ef4444` | Chart color 5 (red) | special-case |

## Sidebar Variables

| Variable | Light Mode | Dark Mode | Purpose | Source |
|----------|------------|-----------|---------|--------|
| `--sidebar-background` | `oklch(0.96 0.02 261)` / `#f8f8fc` | `oklch(0.12 0.02 261)` / `#0f0f1a` | Sidebar background | shadcn |
| `--sidebar-foreground` | `oklch(0.40 0.01 261)` / `#64648c` | `oklch(0.80 0.01 261)` / `#c8c8e6` | Sidebar text | shadcn |
| `--sidebar-primary` | `oklch(0.70 0.20 195)` / `#00ffff` | `oklch(0.70 0.20 195)` / `#00ffff` | Sidebar primary | special-case |
| `--sidebar-primary-foreground` | `oklch(0.00 0.00 0)` / `#000000` | `oklch(0.00 0.00 0)` / `#000000` | Sidebar primary text | shadcn |
| `--sidebar-accent` | `oklch(0.92 0.02 261)` / `#ededf5` | `oklch(0.20 0.02 261)` / `#2a2a3e` | Sidebar accent | shadcn |
| `--sidebar-accent-foreground` | `oklch(0.15 0.02 261)` / `#0f0f23` | `oklch(0.98 0.00 0)` / `#fafafa` | Sidebar accent text | shadcn |
| `--sidebar-border` | `oklch(0.88 0.02 261)` / `#dcdce4` | `oklch(0.20 0.02 261)` / `#2a2a3e` | Sidebar borders | shadcn |
| `--sidebar-ring` | `oklch(0.70 0.20 195)` / `#00ffff` | `oklch(0.70 0.20 195)` / `#00ffff` | Sidebar focus rings | special-case |

## Typography Variables

| Variable | Light Mode | Dark Mode | Purpose | Source |
|----------|------------|-----------|---------|--------|
| `--radius` | `0.75rem` | `0.75rem` | Border radius | shadcn |

## Tailwind Mapping

```css
.theme-cyberpunk {
  --background: 261 2% 98%;
  --foreground: 261 2% 15%;
  --card: 0 0% 100%;
  --card-foreground: 261 2% 15%;
  --popover: 0 0% 100%;
  --popover-foreground: 261 2% 15%;
  --primary: 195 100% 50%;
  --primary-foreground: 0 0% 0%;
  --secondary: 320 100% 50%;
  --secondary-foreground: 0 0% 0%;
  --muted: 261 2% 94%;
  --muted-foreground: 261 1% 40%;
  --accent: 120 75% 55%;
  --accent-foreground: 0 0% 0%;
  --destructive: 25 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: 261 2% 90%;
  --input: 261 2% 90%;
  --ring: 195 100% 50%;
  --chart-1: 195 100% 50%;
  --chart-2: 320 100% 50%;
  --chart-3: 120 75% 55%;
  --chart-4: 270 75% 65%;
  --chart-5: 25 84% 60%;
  --sidebar-background: 261 2% 96%;
  --sidebar-foreground: 261 1% 40%;
  --sidebar-primary: 195 100% 50%;
  --sidebar-primary-foreground: 0 0% 0%;
  --sidebar-accent: 261 2% 92%;
  --sidebar-accent-foreground: 261 2% 15%;
  --sidebar-border: 261 2% 88%;
  --sidebar-ring: 195 100% 50%;
  --radius: 0.75rem;
}

.theme-cyberpunk.dark {
  --background: 261 2% 15%;
  --foreground: 0 0% 98%;
  --card: 261 2% 18%;
  --card-foreground: 0 0% 98%;
  --popover: 261 2% 18%;
  --popover-foreground: 0 0% 98%;
  --primary: 195 100% 50%;
  --primary-foreground: 0 0% 0%;
  --secondary: 320 100% 50%;
  --secondary-foreground: 0 0% 0%;
  --muted: 261 2% 22%;
  --muted-foreground: 261 1% 70%;
  --accent: 261 2% 25%;
  --accent-foreground: 0 0% 98%;
  --destructive: 25 75% 45%;
  --destructive-foreground: 0 0% 98%;
  --border: 261 2% 25%;
  --input: 261 2% 25%;
  --ring: 195 100% 50%;
  --chart-1: 195 100% 50%;
  --chart-2: 320 100% 50%;
  --chart-3: 120 75% 55%;
  --chart-4: 270 75% 65%;
  --chart-5: 25 84% 60%;
  --sidebar-background: 261 2% 12%;
  --sidebar-foreground: 261 1% 80%;
  --sidebar-primary: 195 100% 50%;
  --sidebar-primary-foreground: 0 0% 0%;
  --sidebar-accent: 261 2% 20%;
  --sidebar-accent-foreground: 0 0% 98%;
  --sidebar-border: 261 2% 20%;
  --sidebar-ring: 195 100% 50%;
}
```

## Global Styles

```css
.theme-cyberpunk {
  /* Neon glow effects */
  --neon-glow-cyan: 0 0 10px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.2);
  --neon-glow-magenta: 0 0 10px rgba(255, 0, 255, 0.3), 0 0 20px rgba(255, 0, 255, 0.2);
  --neon-glow-lime: 0 0 10px rgba(163, 230, 53, 0.3), 0 0 20px rgba(163, 230, 53, 0.2);
  
  /* Matrix background pattern */
  --matrix-pattern: radial-gradient(circle at 25% 25%, rgba(0, 255, 255, 0.1) 2px, transparent 2px),
                    radial-gradient(circle at 75% 75%, rgba(255, 0, 255, 0.1) 1px, transparent 1px);
}

.theme-cyberpunk .neon-button {
  box-shadow: var(--neon-glow-cyan);
  border-color: rgba(0, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.theme-cyberpunk .neon-button:hover {
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.4);
  transform: translateY(-1px);
}
```

## Usage Notes

This cyberpunk theme is designed for:
- **Futuristic applications** with dark UI aesthetics
- **Gaming interfaces** and entertainment platforms  
- **Tech-focused dashboards** and developer tools
- **Creative applications** requiring high visual impact

### Key Features:
- **Neon color palette** with cyan, magenta, and lime accents
- **High contrast** for excellent readability in dark environments
- **Glow effects** built into the theme variables
- **Matrix-inspired** background patterns and animations
- **Accessibility compliant** contrast ratios maintained

### Best Practices:
- Use sparingly on accent elements to maintain the neon effect
- Combine with subtle animations for enhanced cyberpunk aesthetics
- Ensure sufficient contrast when overlaying text on glowing elements
- Test in both light and dark modes for optimal user experience