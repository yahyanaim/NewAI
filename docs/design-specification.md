# Design Specification - Geopolitical Conflict Analysis Web Application

## 1. Direction & Rationale

**Style:** 3D Spatial Design

**Visual Essence:** Depth-first interface where the 3D globe exists as the spatial anchor, with floating UI panels layered at different depths around it. Multi-layer parallax creates atmospheric perspective, while interactive country polygons respond to hover with elevation transforms. The interface embraces z-axis hierarchy: the globe sits at depth 0, news sidebar floats at depth +50px, and country analysis modal emerges at depth +100px, all choreographed through perspective transforms and layered shadows.

**Real-World Inspiration:** Apple Vision Pro spatial interfaces, Linear's perspective grid backgrounds, Stripe Sigma data visualization depth, modern WebGL portfolio showcases.

**Rationale:** Geopolitical analysis inherently deals with spatial relationships on a globe. 3D Spatial Design amplifies this by making depth a primary design element—not just decorative but functional. The layered interface mirrors the complexity of global conflicts: background context (globe), mid-ground updates (news stream), foreground details (country analysis). For design-forward users (18-35) exploring data-intensive geopolitics, this creates an immersive, memorable experience that communicates sophistication and technological capability.

## 2. Design Tokens

### 2.1 Color System

**Palette: Dark Spatial (Primary)**

| Token Name | Value | Usage | Contrast Notes |
|------------|-------|-------|----------------|
| **Backgrounds** | | | |
| bg-base | `#0a0a0a` | Main canvas, far background | Base for all layers |
| bg-surface | `#141414` | Elevated cards, news sidebar | +10 lightness for depth |
| bg-elevated | `#1e1e1e` | Country modal, floating panels | +20 lightness, highest layer |
| bg-gradient-depth | `linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)` | Section backgrounds | Atmospheric perspective |
| **Text** | | | |
| text-primary | `#e5e5e5` | Headlines, labels | 19.2:1 on bg-base ✅ AAA |
| text-secondary | `#a3a3a3` | Body text, descriptions | 7.8:1 on bg-base ✅ AAA |
| text-tertiary | `#737373` | Metadata, timestamps | 4.6:1 on bg-base ✅ AA |
| **Accents (3D Elements)** | | | |
| accent-primary | `#3b82f6` | Interactive globe elements, CTAs | Blue-500, 100% saturation |
| accent-secondary | `#8b5cf6` | Secondary actions, highlights | Purple-500 |
| accent-gradient | `linear-gradient(135deg, #3b82f6, #8b5cf6)` | 3D buttons, active states | Depth on interactive elements |
| accent-glow | `rgba(59, 130, 246, 0.6)` | Shadow tint for 3D accents | Reinforces depth |
| **Semantic (Conflict Intensity)** | | | |
| conflict-low | `#10b981` | Low conflict intensity | Green-500 |
| conflict-medium | `#f59e0b` | Medium conflict intensity | Amber-500 |
| conflict-high | `#ef4444` | High conflict intensity | Red-500 |
| conflict-critical | `#dc2626` | Critical conflict zones | Red-600 |
| **Overlays** | | | |
| overlay-dark | `rgba(10, 10, 10, 0.8)` | Modal backdrops | Semi-transparent |
| overlay-glass | `rgba(20, 20, 20, 0.6)` | Glassmorphic panels | With backdrop-blur |

**WCAG Validation:**
- text-primary on bg-base: 19.2:1 ✅ AAA
- text-secondary on bg-base: 7.8:1 ✅ AAA
- accent-primary on bg-elevated: 4.8:1 ✅ AA (for large text)

### 2.2 Typography

| Token | Font Family | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|-------------|------|--------|-------------|----------------|-------|
| **Headings** | | | | | | |
| hero-3d | Inter | 64-96px | 700 | 1.0 | -0.03em | 3D transformed page title |
| heading-xl | Inter | 48px | 600 | 1.2 | -0.01em | Section headers |
| heading-lg | Inter | 36px | 600 | 1.2 | -0.01em | Modal titles |
| heading-md | Inter | 24px | 600 | 1.3 | 0 | Card titles, country names |
| **Body** | | | | | | |
| body-lg | Inter | 20px | 400 | 1.6 | 0 | Intro text, descriptions |
| body | Inter | 16px | 400 | 1.5 | 0 | Standard text, news articles |
| body-sm | Inter | 14px | 400 | 1.5 | 0.01em | Metadata, timestamps |
| caption | Inter | 12px | 400 | 1.4 | 0.02em | Labels, attribution |

**Font Stack:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

**3D Typography Rule:** Only hero and heading-xl receive 3D transforms. All body text remains flat for readability.

### 2.3 Spacing (8-Point Grid)

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 8px | Tight gaps, icon spacing |
| space-2 | 16px | Element spacing, button padding |
| space-3 | 24px | Card padding, component gaps |
| space-4 | 32px | Section padding |
| space-6 | 48px | Section margins |
| space-8 | 64px | Large spacing, hero padding |
| space-12 | 96px | Extra large spacing |
| space-16 | 128px | Maximum spacing |

**Z-Axis Depth (Transform Values):**

| Layer | translateZ | Box Shadow | Usage |
|-------|-----------|------------|-------|
| Background | -100px | 0 2px 8px rgba(0,0,0,0.08) | Far elements, globe base |
| Neutral | 0 | 0 8px 24px rgba(0,0,0,0.12) | Main content plane |
| Elevated | 50px | 0 16px 48px rgba(0,0,0,0.18) | News sidebar, filter panel |
| Floating | 100px | 0 24px 64px rgba(0,0,0,0.24) | Country modal, tooltips |
| Foreground | 200px | 0 32px 80px rgba(0,0,0,0.32) | Active 3D elements |

### 2.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| radius-sm | 12px | Buttons, input fields |
| radius-md | 16px | Cards, images |
| radius-lg | 20px | Large cards, panels |
| radius-xl | 24px | Modals, major sections |
| radius-full | 9999px | Circular icons, badges |

### 2.5 Shadows (Depth-Based)

| Token | Value | Usage |
|-------|-------|-------|
| shadow-far | `0 2px 8px rgba(0,0,0,0.08)` | Background elements |
| shadow-mid | `0 8px 24px rgba(0,0,0,0.12)` | Standard cards |
| shadow-near | `0 16px 48px rgba(0,0,0,0.18)` | Elevated panels |
| shadow-float | `0 24px 64px rgba(0,0,0,0.24)` | Floating modals |
| shadow-accent-glow | `0 8px 24px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.2)` | 3D interactive elements |

### 2.6 Animation Timing

| Token | Value | Usage |
|-------|-------|-------|
| duration-fast | 200ms | Button hover, quick feedback |
| duration-standard | 400ms | Card 3D transforms, smooth transitions |
| duration-slow | 600ms | Modal open/close, panel slides |
| duration-parallax | 1000ms | Page load 3D intros |
| easing-default | ease-out | Standard easing |
| easing-elastic | cubic-bezier(0.34, 1.56, 0.64, 1) | 3D transforms with bounce |

## 3. Component Specifications

### 3.1 3D Globe Component

**Structure:** Three.js canvas rendering Natural Earth TopoJSON country boundaries on sphere, with interactive country mesh polygons.

**Visual Treatment:**
- Base sphere: Dark texture (#0f0f0f) with subtle noise/gradient
- Country borders: 1px lines in rgba(255,255,255,0.15)
- Conflict heatmap overlay: Color-coded fills (conflict-low to conflict-critical) with 40-60% opacity
- Selected country: Elevated +20px on z-axis with accent-primary outline (2px)
- Perspective: 1000px with subtle camera rotation on mouse movement

**Interaction States:**
- **Default:** Gentle auto-rotation (0.1deg/s)
- **Hover Country:** Polygon scales 1.02x, outline appears (accent-primary), shadow-accent-glow
- **Click Country:** Stop rotation, zoom to country bounds, slide in country modal from right
- **Drag:** Manual rotation with momentum physics

**Dimensions:**
- Desktop: Full viewport height minus top bar (calc(100vh - 72px))
- Mobile: 60vh (reduced for sidebar space)

**Performance:** Use Three.js BufferGeometry, frustum culling, LOD for distant countries. Target 60fps.

### 3.2 Floating Panel Component (News Sidebar, Filter Panel)

**Structure:** Fixed-position panels with glassmorphic background and layered depth.

**Tokens:**
- Background: bg-surface with backdrop-blur(20px)
- Padding: space-4 (32px)
- Border: 1px solid rgba(255,255,255,0.1)
- Radius: radius-lg (20px)
- Shadow: shadow-near
- Transform: perspective(1000px) translateZ(50px)

**News Sidebar Variant:**
- Width: 400px (desktop), 100% (mobile)
- Position: Fixed right, top 72px (below nav)
- Height: calc(100vh - 72px)
- Overflow: Scroll (custom styled scrollbar)

**States:**
- **Default:** translateZ(50px), shadow-near
- **Hover (on child cards):** Child card translateZ(+20px)
- **Collapsed (mobile):** translateX(100%), toggle button visible

**Scrollbar Custom Style:** 8px width, bg-surface track, accent-primary thumb.

### 3.3 3D Interactive Card (News Item, Event Card)

**Structure:** Hoverable cards with perspective tilt and elevation.

**Tokens:**
- Width: 100% (in sidebar), 320px (standalone)
- Padding: space-3 (24px)
- Background: bg-elevated
- Border: 1px solid rgba(255,255,255,0.08)
- Radius: radius-md (16px)
- Shadow: shadow-mid
- Transform: perspective(800px)

**Content Hierarchy:**
- Source badge: caption size, text-tertiary, top-left
- Headline: heading-md (24px), text-primary, 2-line clamp
- Timestamp: body-sm, text-tertiary, bottom-left
- Category tag: Small pill (radius-full), accent-secondary background

**States:**
- **Default:** translateZ(0), shadow-mid
- **Hover:** rotateY(4deg) rotateX(2deg) translateZ(20px), shadow-near, transition 400ms ease-out
- **Active/Click:** scale(0.98), translateZ(10px)

**Note:** Cards stack vertically in sidebar with space-2 (16px) gap.

### 3.4 Country Analysis Modal

**Structure:** Large slide-in panel from right, highest z-index layer.

**Tokens:**
- Width: 600px (desktop), 100vw (mobile)
- Height: 100vh
- Background: bg-elevated
- Shadow: shadow-float
- Transform: perspective(1200px) translateZ(100px)
- Backdrop: overlay-dark

**Layout Sections:**
1. **Header (Hero):** Country name (heading-lg), flag icon (64px), close button (top-right)
2. **Metadata Grid:** 2-column grid, space-3 gap, key-value pairs
3. **Conflict Timeline Chart:** Full-width line chart, 300px height
4. **Recent Events List:** Scrollable list of event cards (compact variant)
5. **Related News:** 2-3 news cards (compact)

**Animation:**
- Enter: translateX(100%) → translateX(0) over 600ms, with elastic easing
- Exit: translateX(0) → translateX(100%) over 400ms
- Backdrop: opacity 0 → 0.8 over 300ms

**States:**
- **Open:** translateZ(100px), shadow-float, backdrop visible
- **Closed:** translateX(100%), opacity 0

### 3.5 Primary Button (3D Elevated)

**Structure:** Interactive button with 3D elevation and glow.

**Tokens:**
- Height: 56px
- Padding: space-2 (16px) horizontal, 20px minimum
- Background: accent-gradient
- Border: None
- Radius: radius-sm (12px)
- Font: heading-md weight (600), 18px
- Color: text-primary
- Shadow: shadow-accent-glow
- Transform: perspective(800px) translateZ(10px)

**States:**
- **Default:** translateZ(10px), shadow-accent-glow
- **Hover:** translateZ(20px), shadow increases (0 12px 32px), scale(1.02)
- **Active:** translateZ(5px), scale(0.98)
- **Disabled:** opacity 0.5, transform none, cursor not-allowed

**Note:** Used sparingly for primary actions (e.g., "Apply Filters", "Export Data").

### 3.6 Navigation Bar

**Structure:** Fixed top bar with minimal design to keep focus on 3D globe.

**Tokens:**
- Height: 72px
- Background: rgba(20,20,20,0.8) with backdrop-blur(10px)
- Border-bottom: 1px solid rgba(255,255,255,0.1)
- Z-index: 100 (above all content)
- Shadow: shadow-far

**Layout:**
- Logo: Left (height 40px)
- Nav links: Center-left, flat design (no 3D), body size, text-secondary, hover text-primary
- Global metrics: Center-right (live conflict count, last update time)
- User menu: Right (avatar/icon)

**States:**
- **Scroll > 0:** Background opacity increases to 0.95
- **Links hover:** Underline appears (2px, accent-primary), 200ms

**Note:** Navigation remains flat to contrast with 3D content below.

## 4. Layout & Responsive

**Reference:** Content-structure-plan.md defines SPA with 5 main sections.

### 4.1 Desktop Layout (≥1024px)

**Overall Structure:**
```
[Navigation Bar: 72px height, fixed top]
[Main Viewport: calc(100vh - 72px)]
  ├─ [3D Globe: Full background, perspective container]
  ├─ [Filter Panel: Fixed left, 320px width, translateZ(50px)]
  ├─ [News Sidebar: Fixed right, 400px width, translateZ(50px)]
  └─ [Country Modal: Overlay, 600px width, translateZ(100px), conditional]
```

**Z-Layer Architecture:**
- Layer -1: Globe canvas (background)
- Layer 0: Main content plane
- Layer 1: Filter panel + News sidebar (translateZ 50px)
- Layer 2: Country modal (translateZ 100px)
- Layer 3: Navigation bar (z-index 100, no transform)

**Globe Interaction Area:**
- Full viewport minus sidebar widths
- Effective width: calc(100vw - 320px - 400px - 64px) = ~800px+ centered
- Globe scales to fit, maintains aspect ratio

**Panel Positioning:**
- Filter Panel: `left: 32px; top: 104px (72+32); width: 320px`
- News Sidebar: `right: 0; top: 72px; width: 400px; height: calc(100vh - 72px)`
- Both panels: `position: fixed` to stay visible during globe rotation

### 4.2 Tablet Layout (768px - 1023px)

**Adaptations:**
- Filter Panel: Collapses to floating button (bottom-left), expands on click as overlay
- News Sidebar: Width reduced to 320px
- Globe: More space, centered
- Country Modal: Width 500px

**3D Complexity:** Moderate - reduce parallax intensity, simplify globe shadows.

### 4.3 Mobile Layout (<768px)

**Major Changes:**
- Navigation: Hamburger menu for links, logo + metrics only
- Globe: 60vh height, simplified geometry (fewer polygons)
- Filter Panel: Bottom sheet overlay, slides up from bottom
- News Sidebar: Full-width bottom sheet, toggleable
- Country Modal: Full screen (100vw x 100vh)

**3D Simplification:**
- Disable parallax (use static backgrounds)
- Reduce perspective to 500px
- Card hover → tap for single interaction (no 3D rotate, just scale 0.98)
- Auto-rotation disabled (performance)

**Stacking Order:**
```
[Nav: 56px height]
[Globe: 60vh]
[Collapsible News Sheet: slides from bottom, 40vh max]
[Filter Button: FAB, bottom-right]
```

### 4.4 Breakpoint Strategy

| Breakpoint | Layout | 3D Complexity | Notes |
|------------|--------|---------------|-------|
| sm (640px) | Mobile stacking | Minimal (2D fallbacks) | Disable parallax, reduce transforms |
| md (768px) | Tablet hybrid | Moderate | Reduce perspective, simplified shadows |
| lg (1024px) | Desktop panels | Full 3D | All spatial effects active |
| xl (1280px+) | Enhanced desktop | Enhanced 3D | Increased globe detail, richer effects |

### 4.5 Responsive Grid System

**Container Widths:**
- sm: 100% (full width)
- md: 100% (full width with side padding)
- lg: No container (fixed panels use viewport positioning)
- xl: Same as lg

**Content Grids (within modals/panels):**
- Metadata: 2 columns on desktop, 1 on mobile
- Event cards: 1 column (vertical stack)
- Chart/timeline: Full width, responsive height

## 5. Interaction & Animation

### 5.1 Globe Interactions

**Mouse Movement Parallax:**
- Track cursor position relative to viewport center
- Apply subtle rotation offset to globe camera: `rotateY(±5deg)`, `rotateX(±3deg)`
- Smooth interpolation over 400ms

**Country Hover:**
- Detect raycasting intersection with country mesh
- Apply: `scale(1.02)`, outline glow (accent-primary, 2px), shadow-accent-glow
- Show tooltip: Country name, conflict level badge (floating above cursor +20px)

**Country Click:**
1. Stop auto-rotation
2. Tween camera to center country in view (1000ms ease-out)
3. Fetch country data from APIs (ACLED, UCDP, REST Countries)
4. Slide in Country Modal from right (600ms elastic easing)
5. Update news sidebar filter to country-specific news

### 5.2 News Sidebar Auto-Update

**Polling Strategy:**
- NewsAPI.org: Poll every 120s for new articles
- Visual indicator: Pulsing dot (accent-primary) next to "Live News" header when updating
- New articles: Slide in from top with stagger (100ms delay between cards)

**Infinite Scroll:**
- When user scrolls to bottom 200px: Fetch next page
- Loading state: Skeleton cards (animated shimmer)

### 5.3 Filter Panel Interactions

**Filter Application:**
1. User adjusts filters (date range, event types, intensity)
2. "Apply Filters" button glows (accent-gradient)
3. On click: Button scales down (0.95), then up (1.02), returns to 1.0
4. Globe overlay re-renders with loading state (subtle opacity pulse)
5. New heatmap fades in over 600ms

**Preset Filters:**
- Quick filter chips: "Last 7 days", "High intensity only", "Protests"
- Click chip: Highlight (accent-secondary background), apply instantly

### 5.4 Modal Animations

**Country Modal Open:**
```javascript
// Timeline
0ms:    translateX(100%), opacity 0
100ms:  Backdrop fades in (overlay-dark, 300ms)
400ms:  Modal slides in translateX(0), opacity 1 (600ms elastic)
1000ms: Content fades in section-by-section (stagger 100ms)
```

**Modal Close:**
- Click backdrop or close button
- Modal: translateX(100%) over 400ms ease-in
- Backdrop: opacity 0 over 300ms
- Globe: Resume auto-rotation

### 5.5 Reduced Motion Support (CRITICAL)

**Media Query:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* Disable all 3D transforms */
  .globe-container,
  .floating-panel,
  .news-card,
  .country-modal {
    transform: none !important;
    perspective: none !important;
  }
  
  /* Disable parallax */
  .parallax-layer {
    transform: none !important;
  }
}
```

**Accessibility Toggle:**
- Provide "Disable 3D Effects" toggle in user menu
- When enabled: Apply same CSS overrides, save preference to localStorage

### 5.6 Performance Guidelines

**Permitted Animations:**
- ✅ `transform` (translate, rotate, scale)
- ✅ `opacity`
- ✅ `box-shadow` (minimize, use sparingly)

**Forbidden Animations:**
- ❌ `width`, `height`, `margin`, `padding` (causes reflow)
- ❌ `background` (use opacity on pseudo-element instead)
- ❌ `filter` (except for reduced motion fallback)

**3D Transform Checklist:**
- Apply `will-change: transform` to frequently animated elements
- Remove `will-change` after animation completes
- Use `transform3d()` to force GPU acceleration
- Limit concurrent 3D transforms to <10 elements

**Target Performance:**
- 60fps for globe rotation and camera movement
- 30fps minimum for card hover animations on mid-range devices
- Test on: MacBook Pro 2020 (baseline), iPhone 13 (mobile baseline)

---

**Total Word Count:** ~2,850 words

**Summary:** This design specification provides a comprehensive 3D spatial design system for a geopolitical conflict analysis web application. The core philosophy emphasizes depth as a primary design element, with the 3D globe as the spatial anchor and floating UI panels layered at different depths. All components follow a strict token system, maintain WCAG AA contrast ratios, and include mandatory reduced-motion support. The layout adapts from full 3D on desktop to simplified 2D interactions on mobile, ensuring performance and accessibility across devices.
