# Integration Test Instructions for Subtask 6-1

## Overview
This document provides manual testing instructions for verifying the Next.js export functionality end-to-end.

## Prerequisites Created
The following API routes have been created to enable the export functionality:

1. **GET /api/export/quality** - Generates quality report for a website
2. **POST /api/export/preview** - Generates preview of website export
3. **POST /api/export/download** - Generates and downloads website export as ZIP

## API Routes Implementation

### Quality Report Endpoint
- **File**: `src/app/api/export/quality/route.ts`
- **Method**: GET
- **Query Params**: `websiteId` (required)
- **Returns**: Quality report with component status, accuracy metrics, issues, and recommendations

### Preview Endpoint
- **File**: `src/app/api/export/preview/route.ts`
- **Method**: POST
- **Body**: Export configuration (websiteId, format, options, seoMetadata)
- **Returns**: Preview URL for viewing generated static site

### Download Endpoint
- **File**: `src/app/api/export/download/route.ts`
- **Method**: POST
- **Body**: Export configuration (websiteId, format, options, seoMetadata)
- **Returns**: ZIP file stream with exported project

## Manual Test Steps

### Step 1: Start Development Server
```bash
npm run dev
```

The server should start on http://localhost:3000

### Step 2: Navigate to Export Page
```bash
# Using the existing website ID
open http://localhost:3000/export/website-58f08468-e52f-47b2-a853-423fd8938e5a
```

**Expected Result:**
- Export page loads successfully
- Quality report displays in right column
- Format selector shows three options (Next.js, Static HTML/CSS, React Components)
- Options panel shows configuration checkboxes
- SEO form shows input fields

### Step 3: Select Next.js Format
- Click on the "Next.js Project" card in the format selector
- Verify it becomes selected (visual feedback)

### Step 4: Configure Options (Optional)
- Enable/disable interactivity, image optimization, and sitemap generation
- Enter SEO metadata (title, description, OG image)

### Step 5: Download ZIP
- Click the "Download Export" button
- Wait for processing (loading state should show)

**Expected Result:**
- Browser triggers download of ZIP file
- Filename format: `{websiteId}-nextjs-export.zip`
- No errors displayed

### Step 6: Extract and Test Next.js Project
```bash
# Extract the ZIP file
unzip {websiteId}-nextjs-export.zip -d test-export

# Navigate to extracted directory
cd test-export

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected Result:**
- `npm install` completes successfully with no errors
- `npm run dev` starts the Next.js development server
- Server starts on port 3000 (or next available port)
- Console shows "Ready in X ms"

### Step 7: Verify Exported Website
```bash
# Open in browser
open http://localhost:3000
```

**Expected Result:**
- Website loads successfully
- All components render correctly
- Styling matches original website
- No console errors
- Images load properly
- Interactive elements work (if enabled)

### Step 8: Verify Project Structure
```bash
# Check exported files exist
ls -la test-export/

# Should contain:
# - package.json
# - next.config.js
# - tailwind.config.js
# - tsconfig.json
# - postcss.config.js
# - .eslintrc.json
# - .gitignore
# - README.md
# - app/ directory
# - components/ directory
# - public/ directory
```

### Step 9: Verify package.json
```bash
cat test-export/package.json
```

**Expected Result:**
- Contains Next.js 14.x dependency
- Contains React 18.x dependencies
- Contains Tailwind CSS dependencies
- Contains all necessary build scripts
- No missing or incorrect dependencies

### Step 10: Verify Component Files
```bash
ls test-export/components/
```

**Expected Result:**
- All approved components exported as .tsx files
- Each component has proper TypeScript types
- Components use approved variant or custom code
- Files follow naming conventions

## Verification Checklist

- [ ] API routes created and compilable
- [ ] Export page loads without errors
- [ ] Quality report displays correctly
- [ ] Format selection works
- [ ] Options panel toggles work
- [ ] SEO form accepts input
- [ ] Download button triggers export
- [ ] ZIP file downloads successfully
- [ ] ZIP extracts without errors
- [ ] package.json is valid
- [ ] npm install completes successfully
- [ ] npm run dev starts server
- [ ] Website renders at localhost:3000
- [ ] No console errors in browser
- [ ] All components visible
- [ ] Styling matches design system
- [ ] README.md contains setup instructions

## Known Limitations

This test requires:
1. A running Next.js development server (npm run dev)
2. An existing website in the database with approved components
3. Node.js and npm installed on the system
4. A web browser for manual verification

## Troubleshooting

### Error: "Website not found"
- Verify the website ID exists in the database
- Check that components have been generated and approved

### Error: "Export failed"
- Check server logs for detailed error messages
- Verify design tokens exist for the website
- Ensure components have approved variants or custom code

### ZIP download doesn't start
- Check browser console for errors
- Verify API endpoint returns 200 status
- Check server has write permissions to exports/ directory

### npm install fails in exported project
- Verify package.json is valid JSON
- Check all dependency versions are available
- Try deleting node_modules and package-lock.json, then retry

### Website doesn't render correctly
- Verify components were approved before export
- Check browser console for runtime errors
- Verify design tokens were properly converted to Tailwind config

---

# Integration Test Instructions for Subtask 6-2

## Overview
This section provides manual testing instructions for verifying the Static HTML/CSS export functionality end-to-end.

## Test Objective
Verify that the Static HTML export produces a standalone website that:
1. Opens directly in a web browser without any build step
2. Renders all components correctly with proper styling
3. Includes optimized assets and CSS
4. Contains working interactivity (if enabled)
5. Requires no Node.js, npm, or build tools to view

## Prerequisites
- A running Next.js development server (npm run dev at http://localhost:3000)
- An existing website in the database with approved components
- A web browser for viewing the exported static site
- ZIP extraction tool

## Manual Test Steps

### Step 1: Navigate to Export Page
```bash
# Using the existing website ID
open http://localhost:3000/export/website-58f08468-e52f-47b2-a853-423fd8938e5a
```

**Expected Result:**
- Export page loads successfully
- Quality report displays in the page
- Format selector shows three format options
- Options panel shows configuration checkboxes
- SEO form displays input fields

### Step 2: Select Static HTML/CSS Format
- Click on the "Static HTML/CSS" card in the format selector
- Verify it becomes visually selected (highlighted state)

**Expected Result:**
- Static HTML/CSS format card shows selected state
- No errors in browser console

### Step 3: Configure Export Options
- **Enable Interactivity**: Toggle to enable/disable interactive JavaScript features
- **Optimize Images**: Toggle to enable/disable image optimization
- **Generate Sitemap**: Toggle to enable/disable sitemap generation

**Recommended Configuration for Testing:**
- ✅ Enable Interactivity: ON
- ✅ Optimize Images: ON
- ✅ Generate Sitemap: ON

### Step 4: Enter SEO Metadata (Optional)
Fill in the SEO form fields:
- **Title**: "Test Static Export"
- **Description**: "Testing static HTML/CSS export functionality"
- **OG Image**: (leave empty or provide a URL)
- **OG Image Alt**: "Test image"

### Step 5: Download Static HTML Export
- Click the "Download Export" button
- Wait for processing (loading spinner should appear)
- Browser should automatically trigger download

**Expected Result:**
- Download starts within a few seconds
- Filename format: `{websiteId}-static-export.zip`
- File size is reasonable (typically 100KB - 5MB depending on assets)
- No errors displayed in UI
- No errors in browser console

### Step 6: Extract ZIP File
```bash
# Create test directory
mkdir -p ~/test-static-export
cd ~/test-static-export

# Extract the downloaded ZIP
unzip ~/Downloads/{websiteId}-static-export.zip
```

**Expected Result:**
- ZIP extracts without errors
- No corruption warnings

### Step 7: Verify File Structure
```bash
# List extracted files
ls -la

# Expected file structure:
# - index.html           (main HTML file)
# - styles.css           (compiled CSS with design tokens)
# - assets/              (directory for images and other assets)
# - script.js            (optional - if interactivity enabled)
# - README.md            (setup instructions)
```

**Verification Commands:**
```bash
# Check index.html exists and has content
test -f index.html && echo "✓ index.html exists"
[ -s index.html ] && echo "✓ index.html has content"

# Check styles.css exists and has content
test -f styles.css && echo "✓ styles.css exists"
[ -s styles.css ] && echo "✓ styles.css has content"

# Check assets directory exists
test -d assets && echo "✓ assets/ directory exists"

# Check for interactivity script (if enabled)
test -f script.js && echo "✓ script.js exists (interactivity enabled)"

# Check README
test -f README.md && echo "✓ README.md exists"
```

### Step 8: Open in Browser
```bash
# Open index.html directly in default browser
open index.html

# Or specify a browser:
# macOS
open -a "Google Chrome" index.html
open -a "Safari" index.html
open -a "Firefox" index.html

# Linux
google-chrome index.html
firefox index.html

# Windows (Git Bash / WSL)
start index.html
```

**Expected Result:**
- Website opens immediately without any build step
- Page loads within 1-2 seconds
- No "localhost" or server required
- Works as a local file (file:// protocol)

### Step 9: Visual Verification
With the website open in the browser, verify:

**Layout & Structure:**
- [ ] All components are visible on the page
- [ ] Components appear in the correct order
- [ ] Page has proper header/hero/content/footer structure
- [ ] No missing content or blank sections

**Styling:**
- [ ] All styling is applied correctly
- [ ] Colors match the design system
- [ ] Typography (fonts, sizes, weights) appears correct
- [ ] Spacing and padding look consistent
- [ ] Responsive design works (resize browser window)
- [ ] No unstyled or broken elements
- [ ] Hover states work on interactive elements

**Assets:**
- [ ] All images load successfully
- [ ] No broken image icons
- [ ] Images are properly sized and positioned
- [ ] Images use lazy loading (check Network tab)
- [ ] No missing assets in console errors

**SEO & Metadata:**
- [ ] Page title matches SEO metadata entered
- [ ] View page source shows meta description tag
- [ ] Open Graph tags present (if SEO metadata provided)
- [ ] Favicon appears in browser tab (if included)

### Step 10: Browser Console Verification
Open browser developer tools (F12 or Cmd+Option+I):

**Console Tab:**
- [ ] No JavaScript errors (red messages)
- [ ] No CSS loading errors
- [ ] No asset loading failures (404 errors)
- [ ] No CORS errors

**Network Tab:**
- [ ] All assets load successfully (green/200 status)
- [ ] CSS file loads correctly
- [ ] All images load without errors
- [ ] JavaScript file loads (if interactivity enabled)

### Step 11: Interactivity Testing (If Enabled)
If "Enable Interactivity" was toggled ON, test interactive features:

**Mobile Menu:**
- [ ] Click hamburger menu icon (if present)
- [ ] Mobile menu opens/closes correctly
- [ ] Menu items are clickable
- [ ] Smooth animations work

**Dropdowns:**
- [ ] Click dropdown toggles (if present)
- [ ] Dropdown content expands/collapses
- [ ] Only one dropdown open at a time
- [ ] Click outside closes dropdown

**Modals:**
- [ ] Click modal triggers (if present)
- [ ] Modal opens with backdrop
- [ ] Close button closes modal
- [ ] Click backdrop closes modal
- [ ] Escape key closes modal
- [ ] Focus trapped in modal when open

**Smooth Scrolling:**
- [ ] Click anchor links (if present)
- [ ] Page scrolls smoothly to target section
- [ ] URL hash updates correctly

**Keyboard Navigation:**
- [ ] Tab key navigates through interactive elements
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/dropdowns
- [ ] Focus visible on all interactive elements

### Step 12: Verify README.md
```bash
# View README content
cat README.md
```

**Expected Content:**
- [ ] Clear title describing the export
- [ ] Instructions for opening the website
- [ ] Browser compatibility information
- [ ] File structure explanation
- [ ] Notes about assets and interactivity
- [ ] Contact or support information (if applicable)

### Step 13: Cross-Browser Testing (Optional but Recommended)
Test the exported static site in multiple browsers:

- [ ] **Google Chrome**: Latest version
- [ ] **Safari**: Latest version (macOS)
- [ ] **Firefox**: Latest version
- [ ] **Microsoft Edge**: Latest version

**For each browser, verify:**
- Page loads correctly
- All styling renders properly
- Interactive features work (if enabled)
- No browser-specific console errors

### Step 14: Mobile Responsiveness Testing
Test responsive behavior:

**Desktop View (1920x1080):**
- [ ] Full layout displays correctly
- [ ] Navigation bar shows all items
- [ ] Multi-column layouts work

**Tablet View (768x1024):**
- [ ] Layout adjusts appropriately
- [ ] Content remains readable
- [ ] Images scale correctly

**Mobile View (375x667):**
- [ ] Single-column layout (if designed)
- [ ] Mobile menu appears (hamburger icon)
- [ ] Touch targets are appropriately sized
- [ ] Text is readable without zooming
- [ ] No horizontal scrolling

### Step 15: Performance Verification
Check performance metrics in browser DevTools:

**Lighthouse Audit (Chrome):**
```
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Performance" + "Accessibility" + "Best Practices" + "SEO"
4. Click "Generate report"
```

**Expected Scores:**
- [ ] Performance: 90+ (green)
- [ ] Accessibility: 85+ (green/yellow)
- [ ] Best Practices: 90+ (green)
- [ ] SEO: 90+ (green)

**Performance Checks:**
- [ ] Page loads in under 2 seconds on local file system
- [ ] First Contentful Paint (FCP) < 1s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Total page size < 2MB (excluding large images)
- [ ] Images use lazy loading

## Verification Checklist Summary

### File Structure ✓
- [ ] index.html exists with complete HTML structure
- [ ] styles.css exists with compiled CSS
- [ ] assets/ directory contains all images
- [ ] script.js exists (if interactivity enabled)
- [ ] README.md provides clear instructions
- [ ] No build tools or package.json required

### Browser Rendering ✓
- [ ] Opens directly in browser with file:// protocol
- [ ] No server or build step required
- [ ] All components render correctly
- [ ] Styling matches design system
- [ ] Images load successfully
- [ ] No console errors
- [ ] Responsive design works

### Interactivity ✓
- [ ] Mobile menu works (if present)
- [ ] Dropdowns function correctly (if present)
- [ ] Modals open/close properly (if present)
- [ ] Smooth scrolling works (if present)
- [ ] Keyboard navigation accessible

### SEO & Metadata ✓
- [ ] Title tag matches input
- [ ] Meta description present
- [ ] Open Graph tags included (if provided)
- [ ] Semantic HTML structure

### Performance ✓
- [ ] Loads quickly from file system
- [ ] Lighthouse scores 90+
- [ ] No performance warnings
- [ ] Assets optimized

### Cross-Platform ✓
- [ ] Works in Chrome
- [ ] Works in Safari
- [ ] Works in Firefox
- [ ] Works in Edge
- [ ] Responsive on mobile devices

## Known Limitations

This test requires:
1. A web browser to view the exported static site
2. ZIP extraction tool
3. An existing website in database with approved components
4. No special server or build tools needed for viewing

## Troubleshooting

### Error: "Website not found"
- Verify the website ID exists in the database
- Check that components have been generated and approved
- Ensure design tokens exist for the website

### Error: "No approved components found"
- Verify components have status="approved" in database
- Check that at least one component exists for the website
- Review quality report for component status

### ZIP download doesn't start
- Check browser console for JavaScript errors
- Verify API endpoint is accessible: /api/export/download
- Check server logs for detailed error messages
- Ensure exports/ directory exists and is writable

### ZIP file is corrupted or won't extract
- Re-download the ZIP file
- Try a different extraction tool (unzip, 7-Zip, The Unarchiver)
- Check server logs for ZIP generation errors

### index.html opens but nothing renders
- Check browser console for errors
- Verify styles.css loaded correctly (Network tab)
- Open index.html source - check for content inside <body>
- Verify CSS file path is relative: `<link rel="stylesheet" href="./styles.css">`

### Styles not applied
- Verify styles.css exists in the same directory as index.html
- Check CSS file has content (not empty)
- Verify CSS variables from design tokens are defined
- Check browser console for CSS loading errors

### Images don't load
- Verify assets/ directory contains image files
- Check image paths in index.html (should be relative: ./assets/image.jpg)
- Look for 404 errors in browser Network tab
- Verify image URLs were processed correctly during export

### Interactive features don't work
- Verify "Enable Interactivity" was toggled ON during export
- Check that script.js exists and loaded successfully
- Look for JavaScript errors in browser console
- Verify interactive elements have proper data attributes or classes

### Works in Chrome but not Safari/Firefox
- Check browser console in the failing browser
- Verify CSS uses standard properties (no webkit-only features)
- Check JavaScript uses standard APIs (no Chrome-only features)
- Verify no CORS issues with local file:// protocol

### Mobile view is broken
- Verify viewport meta tag exists: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Check for responsive CSS media queries in styles.css
- Test in actual mobile browser, not just desktop browser resize
- Verify touch targets are appropriately sized (44x44px minimum)

## Success Criteria

Subtask 6-2 is considered complete when:

1. ✅ Static HTML export generates successfully via API
2. ✅ ZIP file downloads without errors
3. ✅ ZIP extracts to proper file structure (index.html, styles.css, assets/, README.md)
4. ✅ Opening index.html in browser renders website correctly
5. ✅ No build step or server required
6. ✅ All components display with proper styling
7. ✅ Images load successfully
8. ✅ No console errors
9. ✅ Interactivity works (if enabled)
10. ✅ Responsive design functions across device sizes
11. ✅ Cross-browser compatible (Chrome, Safari, Firefox, Edge)
12. ✅ SEO metadata properly included
13. ✅ Performance is acceptable (Lighthouse 90+)
14. ✅ README.md provides clear usage instructions

## Next Steps

After completing this test:
- Proceed to subtask-6-3: Verify quality report displays accurate metrics
- Document any issues discovered during testing
- Update implementation if critical bugs are found
- Mark subtask-6-2 as completed in implementation_plan.json
