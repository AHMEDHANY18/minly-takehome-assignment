# Minly Web — Design Language (redesign 2026-06-10)

Single source of truth for the frontend restyle. Tailwind v4 utilities only (the JS config is dead — do NOT use custom color names from it). Dark mode uses the `.dark` class via `@custom-variant` already set up in `src/shared/styles/index.css`. EVERY styled element must have dark variants.

## Direction
Clean, calm, "Linear/Vercel-like" product UI. Content-first, generous whitespace, borders over heavy shadows, one accent color, subtle motion. No glassmorphism except the existing sticky header. No new npm deps.

## Tokens (use these exact utilities)

**Typography** — font is global (Plus Jakarta Sans, set in index.css). Scale:
- Page title: `text-xl font-bold tracking-tight`
- Section title: `text-sm font-semibold`
- Body: `text-[15px]` / secondary `text-sm`
- Meta/caption: `text-xs text-gray-500 dark:text-zinc-400`

**Surfaces**
- App bg: `bg-gray-50 dark:bg-zinc-950` (body handles it; don't repaint per page)
- Card: `bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl shadow-sm`
- Elevated/modal: same + `shadow-xl dark:shadow-black/40`
- Field/input: `bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-[15px] placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 transition`

**Text colors**
- Primary: `text-gray-900 dark:text-zinc-100`
- Secondary: `text-gray-600 dark:text-zinc-400`
- Muted: `text-gray-400 dark:text-zinc-500`

**Accent** — blue only: `blue-600` (hover `blue-700`), dark-mode accents `blue-500/400`. Brand gradient (logo, story rings, primary CTAs allowed): `bg-gradient-to-br from-blue-600 to-indigo-600`.

**Buttons**
- Primary: `inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none`
- Secondary: `... rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 ...`
- Ghost: `... rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 ...`
- Destructive: primary pattern with `bg-red-600 hover:bg-red-700`; quiet-destructive: ghost with `text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40`
- Icon button: `h-10 w-10 rounded-full grid place-items-center text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition`

**Badges/chips**: `inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold` + semantic bg: info `bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300`, success `emerald`, warning `amber`, danger `red`, neutral `bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300`.

**Avatars**: `rounded-full object-cover bg-gray-100 dark:bg-zinc-800`; fallback initial: same bg + `font-semibold text-gray-600 dark:text-zinc-300`. Sizes: 8/10 list, 12 cards, 20-24 profile hero.

**Radius**: cards/modals `rounded-2xl`, buttons/inputs `rounded-xl`, chips/avatars `rounded-full`. No `rounded-md` anywhere.

**Motion** (framer-motion already installed): page/list mount `initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.25}}`; press `active:scale-[0.98]`; hover lift on cards `hover:shadow-md transition-shadow`. Don't animate infinite-scroll items individually.

**Skeletons**: `animate-pulse rounded-(xl|2xl) bg-gray-200/70 dark:bg-zinc-800` blocks matching real layout (no spinners for content areas; spinners only on buttons).

**Empty states**: centered in a card — icon in `h-12 w-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 grid place-items-center` + title `text-sm font-semibold` + one-line hint (muted) + optional primary action.

**Modals/overlays**: `fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm grid place-items-center p-4`; panel = elevated card `w-full max-w-md p-6` with motion scale-in.

## Rules
1. Touch ONLY class names / small markup restructuring + skeleton & empty-state additions. NO logic, hook, API, or route changes. Don't rename/move files.
2. Every color utility gets a dark twin. Audit your output: searching ` bg-white` should always find ` dark:` nearby.
3. Replace ad-hoc grays (e.g. `bg-[#f8f9fa]`, slate-*) with the tokens above. zinc for dark surfaces, gray for light.
4. Keep all existing functionality, test ids, aria-labels; keep responsive breakpoints working (mobile-first).
5. Images: add `loading="lazy"` on grid/card images where missing.
6. Consistency beats creativity — if two pages render the same concept (user row, media card), make them look identical.
