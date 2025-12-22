# ChefKix Design System

> "Design is not just what it looks like and feels like. Design is how it works." — Steve Jobs
> "Details matter. It's worth waiting to get it right." — Steve Jobs

**Version:** 1.0.0 | **Updated:** December 22, 2025

This document is the **single source of truth** for all design decisions in ChefKix.
Every component, every page, every interaction flows from this system.
Deviation from this system is a bug.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [The Five Design Laws](#the-five-design-laws)
3. [Color System](#color-system)
4. [Typography System](#typography-system)
5. [Spacing & Layout](#spacing--layout)
6. [Component Patterns](#component-patterns)
7. [Motion System](#motion-system)
8. [Page Architecture](#page-architecture)
9. [Navigation Laws](#navigation-laws)
10. [Loading States](#loading-states)
11. [Pre-Commit Checklist](#pre-commit-checklist)
12. [Anti-Patterns (DO NOT)](#anti-patterns-do-not)

---

## Philosophy

### The ChefKix DNA

ChefKix is **Instagram meets Duolingo for home cooking**. It must feel:

| Attribute      | Meaning                        | Visual Expression                                             |
| -------------- | ------------------------------ | ------------------------------------------------------------- |
| **Warm**       | Like a kitchen, not a hospital | Parchment backgrounds, espresso text, coral accents           |
| **Playful**    | Gamified but not childish      | XP gains, streaks, achievements with satisfying animations    |
| **Premium**    | Worth paying for               | Deliberate spacing, smooth motion, attention to detail        |
| **Intuitive**  | Zero learning curve            | One path to anything, familiar patterns from Instagram/TikTok |
| **Delightful** | Micro-rewards everywhere       | Confetti, badges, progress indicators, haptic-like springs    |

### The Jobs Standard

Before shipping ANYTHING, ask:

1. **Would I be proud to show this to Steve Jobs?**
2. **Would a first-time user understand this without instructions?**
3. **Does this spark joy or just exist?**
4. **Is every pixel intentional?**

---

## The Five Design Laws

These laws are **non-negotiable**. Violating them is a bug.

### LAW 1: Token-First (Zero Arbitrary Values)

```tsx
// ❌ FORBIDDEN - Arbitrary values become untrackable debt
className = 'w-[92px] h-[320px] text-[14px] gap-[12px]'

// ✅ REQUIRED - Use design tokens
className = 'w-nav h-panel-md text-sm gap-md'
```

**The Chain:** CSS Variable → Tailwind Config → Component Usage

```
globals.css          tailwind.config.js      component.tsx
--nav-w: 80px   →   width: { nav: 'var(--nav-w)' }   →   className='w-nav'
```

### LAW 2: Semantic Over Literal

```tsx
// ❌ WRONG - What is this for?
className = 'bg-[#f8f4ef] text-[#2c2420]'

// ✅ RIGHT - Clear purpose
className = 'bg-bg text-text'
```

| Use Case           | Token                 | NOT This          |
| ------------------ | --------------------- | ----------------- |
| Primary background | `bg-bg`               | `bg-[#f8f4ef]`    |
| Card background    | `bg-bg-card`          | `bg-white`        |
| Primary text       | `text-text`           | `text-[#2c2420]`  |
| Secondary text     | `text-text-secondary` | `text-gray-600`   |
| Muted text         | `text-text-muted`     | `text-gray-400`   |
| Borders            | `border-border`       | `border-gray-200` |

### LAW 3: Motion is Meaning

Every animation must have PURPOSE. Animation for animation's sake is noise.

| Action     | Motion         | Purpose                      |
| ---------- | -------------- | ---------------------------- |
| Page enter | Fade up        | Arrival, fresh start         |
| Card hover | Lift (y: -4)   | Interactive, clickable       |
| Button tap | Scale down     | Haptic feedback              |
| Success    | Confetti/scale | Celebration, reward          |
| Loading    | Spin/pulse     | Patience, progress           |
| Error      | Shake          | Attention, correction needed |

**Use Framer Motion for:** Gestures, orchestration, layout animations
**Use Tailwind for:** Simple spins, pulses, transitions

### LAW 4: One Path to Anything

Users should never wonder "how do I get back?" or "which button is the same thing?"

- **Same feature = Same icon** everywhere
- **Primary nav pages = No back button** (user navigates via nav)
- **Secondary pages = Back button** (user returns to where they came from)
- **No duplicate navigation paths** to the same destination

### LAW 5: Breathing Room

Content needs space to breathe. Dense ≠ Professional. Dense = Overwhelming.

| Content Type     | Max Width                      | Reason                      |
| ---------------- | ------------------------------ | --------------------------- |
| Feed/Timeline    | `max-w-container-lg` (800px)   | Single-column reading       |
| Grid/Discovery   | `max-w-container-xl` (1000px)  | Multi-column cards          |
| Recipe Detail    | `max-w-container-2xl` (1400px) | Rich content, images        |
| Focused Creation | `max-w-container-md` (600px)   | Single task, no distraction |
| Forms/Settings   | `max-w-container-lg` (800px)   | Scannable, not stretched    |

---

## Color System

### Brand Palette

| Token          | Value     | Usage                            |
| -------------- | --------- | -------------------------------- |
| `brand`        | `#ff5a36` | Primary CTAs, key actions, links |
| `brand-hover`  | `#e64a2e` | Hover states                     |
| `brand-subtle` | `#fff0eb` | Light backgrounds, tags          |

### Gaming Palette (XP, Streaks, Levels)

| Token           | Value     | Usage                      |
| --------------- | --------- | -------------------------- |
| `xp`            | `#a855f7` | XP gains, points           |
| `streak`        | `#f97316` | Streak counts, fire icons  |
| `streak-urgent` | `#dc2626` | About to lose streak       |
| `level`         | `#eab308` | Level badges, gold         |
| `level-glow`    | `#fde047` | Level-up celebrations      |
| `badge`         | `#06b6d4` | Achievement badges         |
| `rare`          | `#3b82f6` | Rare items, special badges |
| `combo`         | `#ec4899` | Combos, multipliers        |
| `legendary`     | `#f59e0b` | Legendary, premium items   |

### Medal Palette (Leaderboards, Podiums)

| Token               | Value     | Usage                    |
| ------------------- | --------- | ------------------------ |
| `medal-gold`        | `#eab308` | 1st place, gold medals   |
| `medal-gold-glow`   | `#fde047` | Gold highlight/glow      |
| `medal-silver`      | `#94a3b8` | 2nd place, silver medals |
| `medal-silver-glow` | `#e2e8f0` | Silver highlight/glow    |
| `medal-bronze`      | `#d97706` | 3rd place, bronze medals |
| `medal-bronze-glow` | `#fbbf24` | Bronze highlight/glow    |

### Premium Metallic Gradients (Podiums)

These gradients create a **3D metallic shimmer effect** for leaderboard podiums.
Use `style={{ background: 'var(--gradient-medal-gold)' }}` for reliability.

| Token                     | Effect                                        | Usage            |
| ------------------------- | --------------------------------------------- | ---------------- |
| `--gradient-medal-gold`   | 5-stop gold shimmer with highlights & shadows | 1st place podium |
| `--gradient-medal-silver` | 5-stop silver polish with depth               | 2nd place podium |
| `--gradient-medal-bronze` | 5-stop burnished copper with warmth           | 3rd place podium |

```css
/* Example: Premium gold podium with 3D depth */
.podium-gold {
	background: var(--gradient-medal-gold);
	box-shadow:
		0 4px 20px rgba(234, 179, 8, 0.5),
		/* Outer glow */ inset 0 2px 4px rgba(254, 243, 199, 0.4),
		/* Top highlight */ inset 0 -2px 4px rgba(161, 98, 7, 0.3); /* Bottom shadow */
	border-top: 2px solid rgba(254, 243, 199, 0.6); /* Metallic edge */
}
```

> **Warning:** Do NOT use Tailwind gradient classes like `from-medal-gold to-medal-gold-glow` for podiums.
> Use inline CSS with CSS variables for reliable rendering. See [LeaderboardPodium.tsx](src/components/leaderboard/LeaderboardPodium.tsx) for the canonical pattern.

### Contextual Gradients (Icon Boxes)

| Page Type                           | Gradient Token       | Example             |
| ----------------------------------- | -------------------- | ------------------- |
| Core (Home, Explore, Notifications) | `bg-gradient-hero`   | Coral → Purple flow |
| Gamification (Challenges)           | `bg-gradient-streak` | Orange fire         |
| Social (Community)                  | `bg-gradient-social` | Purple → Fuchsia    |
| Creator (Dashboard, Recipes)        | `bg-gradient-xp`     | Purple creative     |
| Utility (Settings, Search)          | `bg-gradient-warm`   | Warm coral          |

> **Note:** Always use predefined gradient tokens (`bg-gradient-*`), never inline `from-X to-Y` patterns.

### Background Tokens

| Token         | Value     | Usage                            |
| ------------- | --------- | -------------------------------- |
| `bg`          | `#f8f4ef` | Page background (warm parchment) |
| `bg-card`     | `#fdfbf8` | Cards, panels (soft cream)       |
| `bg-elevated` | `#f3ede6` | Hover states, elevated surfaces  |
| `bg-hover`    | `#ede7df` | Interactive hover                |
| `bg-input`    | `#faf8f5` | Input fields                     |

### Text Tokens

| Token                   | Value     | Usage                              |
| ----------------------- | --------- | ---------------------------------- |
| `text` / `text-primary` | `#2c2420` | Primary content (espresso)         |
| `text-secondary`        | `#524840` | Secondary content (dark chocolate) |
| `text-tertiary`         | `#7a6f65` | Tertiary content (cocoa)           |
| `text-muted`            | `#a89f94` | Muted content (latte)              |

---

## Typography System

### Font Families

| Family            | Token          | Usage                            |
| ----------------- | -------------- | -------------------------------- |
| Plus Jakarta Sans | `font-sans`    | Body, buttons, navigation        |
| Space Grotesk     | `font-display` | XP numbers, stats, bold headings |
| Playfair Display  | `font-serif`   | Recipe titles, editorial moments |

### Font Sizes

| Token          | Size | Usage                        |
| -------------- | ---- | ---------------------------- |
| `text-2xs`     | 10px | Tiny labels, badges          |
| `text-xs`      | 12px | Metadata, timestamps         |
| `text-sm`      | 14px | Secondary text               |
| `text-caption` | 13px | Captions, small descriptions |
| `text-label`   | 15px | Tab labels, semi-prominent   |
| `text-base`    | 16px | Body text                    |
| `text-lg`      | 20px | Subheadings                  |
| `text-xl`      | 26px | Section headings             |
| `text-2xl`     | 34px | Page titles                  |
| `text-3xl`     | 42px | Hero headings                |

### Heading Hierarchy

```tsx
// Page Title (Primary Nav Pages)
<h1 className='text-3xl font-bold text-text'>Dashboard</h1>

// Section Title
<h2 className='text-2xl font-bold text-text'>Recent Activity</h2>

// Card Title
<h3 className='text-xl font-semibold text-text'>Recipe Name</h3>

// Subsection
<h4 className='text-lg font-semibold text-text-secondary'>Ingredients</h4>
```

---

## Spacing & Layout

### Spacing Scale (8px baseline)

| Token                | Value | Usage           |
| -------------------- | ----- | --------------- |
| `gap-1` / `gap-xs`   | 4px   | Tight icon gaps |
| `gap-2` / `gap-sm`   | 8px   | Inline elements |
| `gap-3` / `gap-md`   | 12px  | Card content    |
| `gap-4` / `gap-lg`   | 16px  | Section gaps    |
| `gap-6` / `gap-xl`   | 24px  | Major sections  |
| `gap-8` / `gap-2xl`  | 32px  | Page sections   |
| `gap-12` / `gap-3xl` | 48px  | Hero sections   |

### Layout Widths

| Token                  | Value  | Usage            |
| ---------------------- | ------ | ---------------- |
| `w-nav`                | 80px   | Left sidebar     |
| `w-right`              | 280px  | Right sidebar    |
| `w-drawer`             | 400px  | Drawers/panels   |
| `max-w-container-sm`   | 480px  | Narrow modals    |
| `max-w-container-md`   | 600px  | Focused creation |
| `max-w-container-lg`   | 800px  | Feed, forms      |
| `max-w-container-xl`   | 1000px | Grids            |
| `max-w-container-form` | 900px  | Wide forms       |

### Component Sizes

| Token            | Value | Usage           |
| ---------------- | ----- | --------------- |
| `size-avatar-xs` | 32px  | Tiny avatars    |
| `size-avatar-sm` | 42px  | Comment avatars |
| `size-avatar-md` | 72px  | Card avatars    |
| `size-avatar-lg` | 100px | Profile avatars |
| `size-avatar-xl` | 120px | Profile header  |
| `size-icon-sm`   | 18px  | Inline icons    |
| `size-icon-md`   | 22px  | Button icons    |
| `size-icon-lg`   | 28px  | Featured icons  |
| `size-icon-xl`   | 32px  | Large icons     |

---

## Component Patterns

### Page Header Pattern (Primary Nav Pages)

All primary navigation pages use this exact pattern:

```tsx
<motion.div
	initial={{ opacity: 0, y: 20 }}
	animate={{ opacity: 1, y: 0 }}
	transition={TRANSITION_SPRING}
	className='mb-6'
>
	<div className='mb-2 flex items-center gap-3'>
		<motion.div
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			transition={{ delay: 0.1, ...TRANSITION_SPRING }}
			className='flex size-12 items-center justify-center rounded-2xl bg-gradient-[CONTEXT] shadow-md'
		>
			<Icon className='size-6 text-white' />
		</motion.div>
		<h1 className='text-3xl font-bold text-text'>Page Title</h1>
	</div>
	<p className='flex items-center gap-2 text-text-secondary'>
		<Sparkles className='size-4 text-streak' />
		Subtitle describing the page
	</p>
</motion.div>
```

### Secondary Page Header Pattern (With Back Button)

```tsx
<motion.div
	initial={{ opacity: 0, y: 20 }}
	animate={{ opacity: 1, y: 0 }}
	transition={TRANSITION_SPRING}
	className='mb-6'
>
	<div className='mb-2 flex items-center gap-3'>
		{/* Back Button */}
		<button
			onClick={() => router.back()}
			className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
		>
			<ArrowLeft className='size-5' />
		</button>
		{/* Icon Box */}
		<motion.div
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			transition={{ delay: 0.1, ...TRANSITION_SPRING }}
			className='flex size-12 items-center justify-center rounded-2xl bg-gradient-[CONTEXT] shadow-md'
		>
			<Icon className='size-6 text-white' />
		</motion.div>
		<h1 className='text-3xl font-bold text-text'>Page Title</h1>
	</div>
	<p className='flex items-center gap-2 text-text-secondary'>
		<Sparkles className='size-4 text-streak' />
		Subtitle
	</p>
</motion.div>
```

### Card Pattern

```tsx
<motion.div
	whileHover={CARD_FEED_HOVER}
	transition={TRANSITION_SPRING}
	className='group rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card transition-all duration-300 hover:shadow-warm md:p-6'
>
	{/* Card content */}
</motion.div>
```

### Button Patterns

```tsx
// Primary Action (Brand coral gradient)
<Button className='bg-gradient-hero text-white shadow-lg shadow-brand/30'>
  Start Cooking
</Button>

// Secondary Action
<Button variant='outline' className='border-border-medium'>
  Save for Later
</Button>

// Ghost Action
<Button variant='ghost' className='text-text-secondary hover:text-text'>
  Cancel
</Button>

// Destructive Action
<Button variant='destructive'>
  Delete
</Button>
```

### Icon Button Pattern

```tsx
<motion.button
	whileHover={ICON_BUTTON_HOVER}
	whileTap={ICON_BUTTON_TAP}
	className='grid size-10 place-items-center rounded-xl text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
>
	<Icon className='size-5' />
</motion.button>
```

### Spinner Pattern

```tsx
// Inline (in buttons)
<Loader2 className='size-4 animate-spin' />

// Section loading
<Loader2 className='size-6 animate-spin text-text-muted' />

// Page loading
<Loader2 className='size-8 animate-spin text-text-muted' />

// Overlay loading
<Loader2 className='size-10 animate-spin text-brand' />
```

---

## Motion System

### Import Pattern

```tsx
import {
	TRANSITION_SPRING,
	TRANSITION_SMOOTH,
	BUTTON_HOVER,
	BUTTON_TAP,
	CARD_FEED_HOVER,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
	staggerContainer,
	staggerItem,
} from '@/lib/motion'
```

### Spring Configuration

| Config              | Use Case                        |
| ------------------- | ------------------------------- |
| `TRANSITION_SPRING` | Default for most animations     |
| `TRANSITION_SMOOTH` | Slower, more elegant animations |
| `TRANSITION_BOUNCY` | Celebratory, playful animations |

### Hover/Tap Presets

| Preset              | Effect             | Use Case          |
| ------------------- | ------------------ | ----------------- |
| `BUTTON_HOVER`      | scale: 1.05, y: -2 | Primary buttons   |
| `BUTTON_TAP`        | scale: 0.98        | Button press      |
| `CARD_FEED_HOVER`   | y: -4              | Feed cards        |
| `CARD_GRID_HOVER`   | y: -6              | Grid cards        |
| `ICON_BUTTON_HOVER` | scale: 1.1         | Icon buttons      |
| `ICON_BUTTON_TAP`   | scale: 0.95        | Icon button press |
| `IMAGE_ZOOM_HOVER`  | scale: 1.05        | Image on hover    |

### Stagger Pattern (Lists)

```tsx
<motion.div variants={staggerContainer} initial='hidden' animate='visible'>
	{items.map(item => (
		<motion.div key={item.id} variants={staggerItem}>
			{/* Item content */}
		</motion.div>
	))}
</motion.div>
```

---

## Page Architecture

### Page Classification

| Page               | Type      | Back Button | Width | Header Pattern           |
| ------------------ | --------- | ----------- | ----- | ------------------------ |
| `/dashboard`       | PRIMARY   | ❌ No       | `lg`  | Icon-box (coral)         |
| `/explore`         | PRIMARY   | ❌ No       | `xl`  | Icon-box (coral)         |
| `/challenges`      | PRIMARY   | ❌ No       | `lg`  | Icon-box (orange)        |
| `/community`       | PRIMARY   | ❌ No       | `xl`  | Icon-box (purple)        |
| `/create`          | PRIMARY   | ❌ No       | `lg`  | Component handles        |
| `/messages`        | PRIMARY   | ❌ No       | Full  | Chat layout              |
| `/profile`         | PRIMARY   | ❌ No       | -     | Redirects to `/{userId}` |
| `/settings`        | PRIMARY   | ❌ No       | `lg`  | Icon-box (gray)          |
| `/notifications`   | SECONDARY | ✅ Yes      | `lg`  | Icon-box (coral)         |
| `/search`          | SECONDARY | ✅ Yes      | `lg`  | Icon-box (gray)          |
| `/leaderboard`     | SECONDARY | ✅ Yes      | `xl`  | Component handles        |
| `/creator`         | SECONDARY | ✅ Yes      | `xl`  | Icon-box (purple)        |
| `/creator/recipes` | SECONDARY | ✅ Yes      | `2xl` | Icon-box (purple)        |
| `/recipes/[id]`    | SECONDARY | ✅ Yes      | `2xl` | Parallax hero            |
| `/post/new`        | SECONDARY | ✅ Yes      | `md`  | Minimal                  |
| `/[userId]`        | SECONDARY | ✅ Yes      | `xl`  | Profile component        |

### PageContainer Usage

```tsx
import { PageContainer } from '@/components/layout/PageContainer'

// Feed pages
<PageContainer maxWidth='lg'>

// Grid pages
<PageContainer maxWidth='xl'>

// Detail pages
<PageContainer maxWidth='2xl'>

// Creation pages
<PageContainer maxWidth='md'>
```

---

## Navigation Laws

### The Four Navigation Laws

1. **One Door Law:** Each destination has ONE clear path. Profile is in sidebar OR dropdown, not both.

2. **Icon Consistency Law:** Same feature = same icon everywhere. Messages uses `MessageCircle` in both sidebar AND topbar.

3. **Primary/Secondary Law:**
   - **Primary pages** (in sidebar nav): No back button. User navigates away via nav.
   - **Secondary pages** (not in nav): Back button required. User returns to origin.

4. **Utility Exception Law:** Utility interfaces (chat, modals) may have custom layouts if documented as intentional.

### Navigation Item Order (LeftSidebar)

1. Home (`/dashboard`)
2. Explore (`/explore`)
3. Challenges (`/challenges`)
4. Community (`/community`)
5. Create (`/create`)
6. Messages (`/messages`)
7. Profile (`/profile`)
8. Settings (`/settings`)

### Topbar Structure

- **Left:** Logo (home link)
- **Center:** Search bar
- **Right:** Notifications (bell), Messages (drawer), Avatar (Settings + Logout dropdown)

---

## Loading States

### Skeleton Hierarchy

| Context   | Pattern                                                     |
| --------- | ----------------------------------------------------------- |
| Full page | `loading.tsx` with page-specific skeleton                   |
| Section   | Skeleton matching content shape                             |
| Button    | `<Loader2 className='size-4 animate-spin' />` inside button |
| Card      | Skeleton with image placeholder + text lines                |

### Auth Loading

```tsx
// Full-screen auth transitions
<AuthLoader /> // Uses Lottie with Loader2 fallback
```

### Skeleton Pattern

```tsx
// Card skeleton
<div className='rounded-radius border border-border-subtle bg-bg-card p-4'>
	<Skeleton className='mb-4 h-48 w-full rounded-lg' />
	<Skeleton className='mb-2 h-6 w-3/4' />
	<Skeleton className='h-4 w-1/2' />
</div>
```

---

## Pre-Commit Checklist

Before pushing ANY code, verify:

### ☐ Token Compliance

- [ ] No arbitrary values (`w-[92px]`, `text-[14px]`)
- [ ] All colors use semantic tokens (`text-text`, `bg-bg-card`)
- [ ] All spacing uses scale tokens (`gap-md`, `p-4`)
- [ ] All sizes use semantic tokens (`size-5`, `size-avatar-sm`)

### ☐ Pattern Compliance

- [ ] Page headers match the unified pattern (icon-box + title + subtitle)
- [ ] Primary pages have NO back button
- [ ] Secondary pages HAVE back button
- [ ] Cards use proper shadow (`shadow-card`) and hover (`hover:shadow-warm`)
- [ ] Buttons use proper variants (`bg-gradient-hero` for primary)

### ☐ Motion Compliance

- [ ] Interactive elements have Framer Motion hover/tap states
- [ ] Page transitions use `<PageTransition>` wrapper
- [ ] Lists use stagger animation where appropriate
- [ ] Spinners use `animate-spin` class, NOT custom animations

### ☐ Accessibility Compliance

- [ ] All interactive elements have `aria-label` where needed
- [ ] Focus states are visible and use brand colors
- [ ] Images have `alt` text
- [ ] Form inputs have associated labels

### ☐ Responsive Compliance

- [ ] Page uses `<PageContainer>` with appropriate `maxWidth`
- [ ] Mobile navigation works correctly
- [ ] Touch targets are at least 44x44 pixels
- [ ] Text is readable on all screen sizes

### ☐ Loading State Compliance

- [ ] Page has `loading.tsx` file
- [ ] Loading skeleton matches content structure
- [ ] Buttons show spinner when loading
- [ ] Empty states use `<EmptyState>` component

---

## Anti-Patterns (DO NOT)

### ❌ NEVER Use Arbitrary Values

```tsx
// ❌ FORBIDDEN
className = 'w-[92px] h-[320px] text-[14px] bg-[#f8f4ef]'

// ✅ REQUIRED
className = 'w-nav h-panel-md text-sm bg-bg'
```

### ❌ NEVER Mix Legacy and Modern Patterns

```tsx
// ❌ FORBIDDEN - Mixed patterns
<Loader2 className='h-4 w-4 animate-spin' />

// ✅ REQUIRED - Modern size-* utility
<Loader2 className='size-4 animate-spin' />
```

### ❌ NEVER Rely on Image URLs Without Fallback

```tsx
// ❌ FORBIDDEN - Image URL can fail, causing broken UI
;<Image src={user.avatarUrl} alt={user.name} />

// ✅ REQUIRED - State-based fallback with icon
const [imgError, setImgError] = useState(false)
const hasValidAvatar = src && !imgError

{
	hasValidAvatar ? (
		<Image src={src} onError={() => setImgError(true)} />
	) : (
		<div className='flex items-center justify-center rounded-full bg-bg-elevated'>
			<ChefHat className='text-text-muted' />
		</div>
	)
}
```

### ❌ NEVER Use Tailwind Gradient Classes for Complex Styling

```tsx
// ❌ FORBIDDEN - Tailwind 4 gradient classes can fail silently
className='bg-gradient-to-t from-medal-gold to-medal-gold-glow'

// ✅ REQUIRED - Inline CSS with CSS variables for reliability
style={{
  background: 'var(--gradient-medal-gold)',
  boxShadow: '0 4px 20px rgba(234, 179, 8, 0.5)',
}}
```

### ❌ NEVER Display Raw Floating-Point Numbers

```tsx
// ❌ FORBIDDEN - JavaScript floating-point artifacts
<span>{xpDiff}</span>  // Outputs: "-201.23000000000002"

// ✅ REQUIRED - Clean formatted numbers
<span>{Math.round(xpDiff).toLocaleString()}</span>  // Outputs: "-201"
```

### ❌ NEVER State Negative Status (UX Psychology)

```tsx
// ❌ FORBIDDEN - Depressing, discouraging
'Competing with 0 friends this week'
'No friends yet'
'You have no activity'

// ✅ REQUIRED - Actionable, encouraging
'No rivals yet! Start the competition'
'Ready to Compete? 🔥'
'Invite friends to start the ultimate cooking showdown'
```

### ❌ NEVER Skip Loading States

```tsx
// ❌ FORBIDDEN - No loading feedback
{
	data && <Content />
}

// ✅ REQUIRED - Proper loading state
{
	isLoading ? <Skeleton /> : <Content />
}
```

### ❌ NEVER Hard-code Z-Index

```tsx
// ❌ FORBIDDEN
className = 'z-50'

// ✅ REQUIRED
className = 'z-dropdown'
```

### ❌ NEVER Create Duplicate Navigation

```tsx
// ❌ FORBIDDEN - Profile in both sidebar AND dropdown
<LeftSidebar items={[...profile]} />
<TopbarDropdown items={[...profile]} />

// ✅ REQUIRED - Profile ONLY in sidebar (Twitter model)
<LeftSidebar items={[...profile]} />
<TopbarDropdown items={[settings, logout]} />
```

### ❌ NEVER Skip Page Wrapper

```tsx
// ❌ FORBIDDEN - No transition or container
export default function Page() {
	return <div>Content</div>
}

// ✅ REQUIRED - Proper wrappers
export default function Page() {
	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>{/* Content */}</PageContainer>
		</PageTransition>
	)
}
```

### ❌ NEVER Use Legacy shadcn Tokens

shadcn/ui's default tokens clash with our design system. Always use our semantic tokens.

```tsx
// ❌ FORBIDDEN - shadcn defaults
className = 'bg-primary text-primary-foreground'
className = 'bg-muted text-muted-foreground'
className = 'bg-secondary text-secondary-foreground'
className = 'bg-primary/20 text-primary'

// ✅ REQUIRED - ChefKix semantic tokens
className = 'bg-brand text-white'
className = 'bg-bg-muted text-text-muted'
className = 'bg-bg-elevated text-text-secondary'
className = 'bg-brand/20 text-brand'
```

### ❌ NEVER Use Token Aliases

Some tokens are aliases. Always use the canonical form for consistency.

```tsx
// ❌ FORBIDDEN - Alias tokens
className = 'bg-panel-bg'

// ✅ REQUIRED - Canonical tokens
className = 'bg-bg-card'
```

### ❌ NEVER Use Hardcoded Tailwind Colors

Hardcoded colors break theming and consistency. Use semantic gaming/brand tokens.

```tsx
// ❌ FORBIDDEN - Hardcoded Tailwind
className = 'text-indigo-500'
className = 'text-purple-600'
className = 'text-amber-500'
className = 'bg-yellow-400'

// ✅ REQUIRED - Semantic gaming tokens
className = 'text-xp' // For XP-related
className = 'text-level' // For level/rank
className = 'text-streak' // For streaks/fire
className = 'text-brand' // For brand accent
```

### ❌ NEVER Use DOM Manipulation in React

This is a React app. Never use jQuery-era DOM manipulation.

```tsx
// ❌ FORBIDDEN - DOM manipulation
document.querySelector('[data-value="discover"]')?.click()
document.getElementById('tab')?.focus()

// ✅ REQUIRED - React state management
setActiveTab('discover')
tabRef.current?.focus()
```

### ❌ NEVER Write Depressing Empty States

Empty states are opportunities, not failures. Users should feel invited, not judged.

```tsx
// ❌ FORBIDDEN - Depressing copy
'No Rankings Yet'
'No friends yet'
'Nothing here'
'No results found'
'Empty'

// ✅ REQUIRED - Encouraging copy with emoji
'Claim Your Throne! 👑'
'Ready to make friends? 🍳'
'Start the Rivalry! 🔥'
'Be the first to cook! 🚀'
'Your adventure starts here ✨'
```

### ❌ NEVER Use Low-Contrast Text on Labels

Important labels (Week X, Day 3, etc.) need sufficient contrast for accessibility.

```tsx
// ❌ FORBIDDEN - Too muted for important labels
className = 'text-text-muted' // On time-sensitive labels

// ✅ REQUIRED - Better contrast hierarchy
className = 'text-text-tertiary' // For secondary labels
className = 'text-text-secondary' // For primary labels
className = 'text-text' // For critical labels
```

---

## Quick Reference Card

### Imports You'll Always Need

```tsx
import { motion } from 'framer-motion'
import {
	TRANSITION_SPRING,
	CARD_FEED_HOVER,
	staggerContainer,
	staggerItem,
} from '@/lib/motion'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { Sparkles } from 'lucide-react'
```

### The Golden Pattern (Page Template)

```tsx
'use client'

import { motion } from 'framer-motion'
import { Icon, Sparkles } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { TRANSITION_SPRING } from '@/lib/motion'

export default function MyPage() {
	return (
		<PageTransition>
			<PageContainer maxWidth='lg'>
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={TRANSITION_SPRING}
					className='mb-6'
				>
					<div className='mb-2 flex items-center gap-3'>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.1, ...TRANSITION_SPRING }}
							className='flex size-12 items-center justify-center rounded-2xl bg-gradient-hero shadow-md shadow-brand/25'
						>
							<Icon className='size-6 text-white' />
						</motion.div>
						<h1 className='text-3xl font-bold text-text'>Page Title</h1>
					</div>
					<p className='flex items-center gap-2 text-text-secondary'>
						<Sparkles className='size-4 text-streak' />
						Page subtitle
					</p>
				</motion.div>

				{/* Content */}
				<div className='space-y-6'>{/* Your content here */}</div>
			</PageContainer>
		</PageTransition>
	)
}
```

---

> "Simplicity is the ultimate sophistication." — Leonardo da Vinci
>
> This system exists so you don't have to think. Follow it, and perfection follows.
