# Accessibility Guidelines

This document outlines the accessibility standards and practices used in the Antigravity Boilerplate to ensure compliance with WCAG 2.1 AA.

## Core Principles

1. **Semantic HTML**: Always use native HTML elements (e.g., `<button>`, `<nav>`, `<header>`, `<footer>`, `<dialog>`) when possible. They come with built-in accessibility properties.
2. **Focus Management**: 
   - Interactive elements must have a visible focus state.
   - We use the `focus-visible` utility globally in `globals.css` with a 2px ring.
   - Example: `*:focus-visible { @apply outline-none ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950; }`
3. **Keyboard Navigation**:
   - Every interactive element must be reachable and operable using a keyboard (Tab, Enter, Space, Arrows).
   - "Skip to main content" links are implemented to allow users to bypass repetitive navigation links.
4. **ARIA Attributes**:
   - Use `aria-label` for icon-only buttons or links.
   - Use `aria-expanded`, `aria-hidden`, and `aria-current` to communicate state changes dynamically.
5. **Color Contrast**:
   - Ensure text has a contrast ratio of at least 4.5:1 against its background.
   - We utilize a curated zinc and indigo palette tested for dark mode contrast.
6. **Touch Targets**:
   - Minimum target size for interactive elements on mobile devices should be 44x44 CSS pixels.

## Testing Accessibility

- Use Lighthouse or axe DevTools to run automated accessibility audits.
- Navigate the application using only the keyboard.
- Use a screen reader (e.g., VoiceOver on Mac, NVDA on Windows) to verify that semantic structure and state changes are announced properly.

## Common Patterns

### Icon Buttons
When using an icon button without visible text, always provide an `aria-label`:

```tsx
<button aria-label="Close modal" onClick={close}>
  <X className="h-4 w-4" aria-hidden="true" />
</button>
```

### Forms
Always associate `<label>` elements with their corresponding `<input>` using the `htmlFor` and `id` attributes.

```tsx
<label htmlFor="email" className="block text-xs font-semibold text-zinc-400">Email Address</label>
<input id="email" type="email" required className="..." />
```

### Mobile Navigation
Mobile tab bars use `aria-label` for each route to ensure screen readers announce the destination clearly, even if text is hidden on small screens.
