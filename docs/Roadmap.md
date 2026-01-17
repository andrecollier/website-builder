# Website Builder - Roadmap

## Current Status
- **Visual Accuracy:** ~90-95%
- **Reference Site:** https://fluence.framer.website/

---

## Phase 1: Core Extraction (Completed)
- [x] Screenshot capture and section detection
- [x] HTML/CSS token extraction
- [x] Component generation pipeline
- [x] Visual comparison tools

## Phase 2: Component Library (Completed)
- [x] Header/Navigation
- [x] Hero section with chat interface
- [x] Features sections (Product Overview)
- [x] About section (purple gradient)
- [x] Why Choose / Key Benefits
- [x] Testimonials with stats
- [x] How It Works (3-step process)
- [x] Pricing plans
- [x] FAQ accordion
- [x] Blog section
- [x] Footer with CTA

## Phase 3: Polish & Styling (In Progress)
- [x] General Sans font integration
- [x] Hover animations (CSS)
- [x] Smooth scroll behavior
- [x] Gradient orbs (About section, Footer/CTA)
- [ ] Dark mode support
- [ ] Loading animations

---

## Phase 3.5: Responsive Design (Critical - Required)

**This phase MUST be integrated into the component generation pipeline.**

All generated components must be responsive across all breakpoints and devices.

### Breakpoints
| Breakpoint | Width | Device |
|------------|-------|--------|
| `xs` | < 480px | Mobile (small) |
| `sm` | 480-640px | Mobile (large) |
| `md` | 640-768px | Tablet (portrait) |
| `lg` | 768-1024px | Tablet (landscape) |
| `xl` | 1024-1280px | Desktop |
| `2xl` | > 1280px | Large desktop |

### Requirements
- [ ] All components must adapt to every breakpoint
- [ ] Typography scales responsively (clamp/fluid typography)
- [ ] Layout shifts from multi-column to single-column on mobile
- [ ] Touch-friendly tap targets (min 44x44px on mobile)
- [ ] Hidden/collapsed navigation on mobile (hamburger menu)
- [ ] Responsive images with srcset/sizes
- [ ] Container queries where appropriate

### Implementation
1. **During Component Generation** - Generate responsive styles as part of the extraction
2. **Breakpoint Detection** - Analyze reference site at multiple viewport sizes
3. **Style Mapping** - Map desktop styles → tablet styles → mobile styles
4. **Tailwind Classes** - Use Tailwind responsive prefixes (sm:, md:, lg:, xl:)
5. **Testing** - Visual comparison at each breakpoint

### Priority Order
1. Mobile-first approach
2. Ensure core functionality works on all devices
3. Progressive enhancement for larger screens

---

## Phase 4: AI Asset Generation (Planned)

### Gemini API Integration
Integrate Google Gemini API for generating high-quality visual assets to achieve pixel-perfect accuracy.

#### Image Assets
- **Icons** - Generate custom SVG icons matching the design system
- **Illustrations** - Create isometric 3D illustrations for feature cards
- **Screenshots** - Generate realistic UI mockups and dashboard previews
- **Avatars** - Create placeholder profile images for testimonials
- **Backgrounds** - Generate gradient backgrounds and patterns

#### Mockups & UI Elements
- **Product mockups** - Generate device frames with screenshots
- **Data visualizations** - Charts, graphs, progress bars
- **3D elements** - Crystal decorations, floating objects
- **Card illustrations** - Team collaboration, workflow diagrams

#### Animations
- **Lottie animations** - Loading spinners, micro-interactions
- **CSS animations** - Hover effects, scroll transitions
- **SVG animations** - Animated icons and illustrations

#### Front-end Code Generation
- **Component variants** - Generate multiple design variations
- **Responsive layouts** - Auto-generate mobile/tablet versions
- **Animation code** - CSS/Framer Motion animation snippets
- **Theme generation** - Color palettes, typography scales

### Implementation Plan
1. Set up Gemini API client
2. Create prompt templates for each asset type
3. Build asset generation pipeline
4. Integrate with component generator
5. Add asset caching and optimization
6. Create fallback system for failed generations

### Expected Benefits
- **Faster iteration** - Generate assets on-demand instead of manual creation
- **Consistency** - AI maintains design system coherence
- **Scalability** - Handle any website without pre-existing assets
- **Quality** - High-fidelity assets matching reference designs

---

## Phase 5: Advanced Features (Future)

### Multi-Page Support & Dashboard Enhancements

When the generator scans a website, the dashboard should:

1. **Page Detection Popup**
   - Detect all available pages on the reference site
   - Show popup asking: "Generate all pages?" or "Select pages"
   - Display page list with checkboxes for multi-select

2. **Page Selection UI**
   ```
   ┌─────────────────────────────────────────┐
   │  Pages Detected (8)                     │
   ├─────────────────────────────────────────┤
   │  ☑ Home (/)                            │
   │  ☑ About (/about)                      │
   │  ☐ Pricing (/pricing)                  │
   │  ☑ Features (/features)                │
   │  ☐ Blog (/blog)                        │
   │  ☐ Contact (/contact)                  │
   │  ☐ Privacy (/privacy)                  │
   │  ☐ Terms (/terms)                      │
   ├─────────────────────────────────────────┤
   │  [Select All] [Generate Selected]      │
   └─────────────────────────────────────────┘
   ```

3. **Generation Queue**
   - Queue selected pages for generation
   - Show progress for each page
   - Allow pause/resume/cancel

4. **Sitemap Integration**
   - Auto-detect pages from sitemap.xml
   - Crawl navigation links to discover pages
   - Handle dynamic routes and parameters

### Extraction Improvements
- [ ] Better semantic understanding of layouts
- [ ] Component pattern recognition
- [ ] Automatic section ordering
- [ ] Multi-page generation with shared components

### Platform Features
- [ ] Real-time preview
- [ ] Drag-and-drop editor
- [ ] Export to multiple frameworks (React, Vue, Svelte)
- [ ] CMS integration
- [ ] Hosting/deployment

### AI Enhancements
- [ ] Design system extraction
- [ ] Brand guideline generation
- [ ] Accessibility improvements
- [ ] SEO optimization suggestions

---

## Technical Debt
- [ ] Refactor inline styles to CSS modules
- [ ] Add TypeScript strict mode
- [ ] Improve error handling
- [ ] Add comprehensive tests
- [ ] Documentation

---

*Last updated: 2026-01-18*
