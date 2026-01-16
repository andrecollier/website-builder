# Integration Test: Quality Report Display and Accuracy Verification

**Test ID:** subtask-6-3
**Feature:** Website Cooker Phase 8 - Final Assembly & Export
**Component:** Quality Report Display
**Test Type:** Integration + Browser Verification
**Estimated Time:** 20-30 minutes

---

## Overview

This test verifies that the quality report on the export page displays accurate metrics that match the underlying database values. It ensures that users can trust the quality assessment before exporting their website.

**What We're Testing:**
1. Quality report section renders correctly on the export page
2. Displayed accuracy metrics match actual database values
3. Component status breakdown reflects database records
4. Issues and recommendations appear when quality problems exist
5. Visual indicators (colors, badges, progress bars) accurately represent the data
6. Report updates when database state changes

---

## Prerequisites

### 1. Development Environment

Ensure the development server is running:

```bash
cd /path/to/website-builder
npm run dev
```

Verify server is accessible at: **http://localhost:3000**

### 2. Database Setup

You need a test website with components in various states:

```bash
# Check existing websites
sqlite3 data/website-cooker.db "SELECT id, name, url FROM websites;"

# Example output:
# website-58f08468-e52f-47b2-a853-423fd8938e5a|Example Website|https://example.com
```

**If no websites exist**, run the capture and generation flow first:
1. Navigate to http://localhost:3000
2. Enter a URL and capture a website
3. Generate components
4. Approve/reject some components to create varied states

### 3. Database Query Tools

Install SQLite CLI if not already available:
```bash
# macOS
brew install sqlite3

# Ubuntu/Debian
sudo apt-get install sqlite3

# Verify installation
sqlite3 --version
```

---

## Test Procedure

### Step 1: Identify Test Website ID

List available websites and choose one for testing:

```bash
sqlite3 data/website-cooker.db "
SELECT
  id,
  name,
  url,
  (SELECT COUNT(*) FROM components WHERE website_id = websites.id) as component_count
FROM websites
WHERE status = 'in_progress'
LIMIT 5;
"
```

**Record the website ID:**
```
WEBSITE_ID=website-___________________________
```

### Step 2: Query Database for Expected Values

Run these queries to capture the current database state. **Record all results** - you'll compare them to the UI display.

#### 2.1 Component Status Breakdown

```bash
sqlite3 data/website-cooker.db "
SELECT
  status,
  COUNT(*) as count
FROM components
WHERE website_id = 'YOUR_WEBSITE_ID_HERE'
GROUP BY status;
"
```

**Expected Output Example:**
```
approved|5
pending|2
rejected|1
failed|0
```

**Record your actual values:**
- Approved: ________
- Pending: ________
- Rejected: ________
- Failed: ________
- **Total: ________ (sum of all counts)**

#### 2.2 Accuracy Scores

```bash
sqlite3 data/website-cooker.db "
SELECT
  c.id,
  c.name,
  c.type,
  c.status,
  ROUND(COALESCE(v.accuracy_score, 0), 2) as accuracy
FROM components c
LEFT JOIN component_variants v ON v.component_id = c.id AND v.variant_name = c.selected_variant
WHERE c.website_id = 'YOUR_WEBSITE_ID_HERE'
ORDER BY c.order_index;
"
```

**Expected Output Example:**
```
component-001|Header|header|approved|92.5
component-002|Hero|hero|approved|88.3
component-003|Footer|footer|approved|95.0
component-004|Navigation|navigation|pending|75.2
component-005|CTA|cta|rejected|60.0
```

**Calculate expected metrics manually:**
- **Average Accuracy:** (sum of all accuracy scores) / (total components) = ________%
- **Excellent (90-100%):** Count components with accuracy ≥ 90 = ________
- **Good (70-89%):** Count components with 70 ≤ accuracy < 90 = ________
- **Fair (50-69%):** Count components with 50 ≤ accuracy < 70 = ________
- **Poor (0-49%):** Count components with accuracy < 50 = ________

#### 2.3 Accuracy by Component Type

```bash
sqlite3 data/website-cooker.db "
SELECT
  c.type,
  ROUND(AVG(COALESCE(v.accuracy_score, 0)), 2) as avg_accuracy,
  COUNT(*) as count
FROM components c
LEFT JOIN component_variants v ON v.component_id = c.id AND v.variant_name = c.selected_variant
WHERE c.website_id = 'YOUR_WEBSITE_ID_HERE'
GROUP BY c.type
ORDER BY c.type;
"
```

**Record per-type accuracy:**
- Header: ________%
- Hero: ________%
- Footer: ________%
- Navigation: ________%
- Content: ________%
- CTA: ________%
- Form: ________%
- Gallery: ________%

### Step 3: Open Export Page in Browser

1. Navigate to the export page:
   ```
   http://localhost:3000/export/YOUR_WEBSITE_ID_HERE
   ```

2. Wait for the page to load completely
   - Loading spinner should disappear
   - Quality Report section should appear on the right side
   - No JavaScript errors in console (press F12 to check)

**✓ Checkpoint:** Page loads without errors and displays quality report section

### Step 4: Verify Quality Report Header

Check the header section of the quality report:

**Elements to verify:**
- [ ] "Quality Report" heading is visible
- [ ] Quality level badge displays (Excellent/Good/Fair/Needs Improvement)
- [ ] Badge color matches quality level:
  - Green = Excellent
  - Blue = Good
  - Yellow = Fair
  - Red = Needs Improvement
- [ ] Generation timestamp is displayed and recent
- [ ] Badge icon is appropriate for quality level (✓ for good/excellent, ! for fair, ✗ for poor)

**Screenshot:** Take a screenshot of the quality report header and save as `quality-report-header.png`

### Step 5: Verify Summary Cards

The quality report displays 4 summary cards. Verify each one:

#### 5.1 Overall Accuracy Card

**Location:** First card (top-left)

**Verify:**
- [ ] Label says "Overall Accuracy"
- [ ] AccuracyBadge component displays
- [ ] Accuracy percentage shown matches your calculated average from Step 2.2: ________%
- [ ] Badge color is appropriate:
  - Green background: 90-100%
  - Blue background: 70-89%
  - Yellow background: 50-69%
  - Red background: 0-49%
- [ ] Percentage value has proper formatting (e.g., "92.5%" not "92.5")

**Record displayed value:** ________%
**Expected value (from Step 2.2):** ________%
**Match:** ☐ Yes ☐ No ☐ Within 1% tolerance

#### 5.2 Approved Components Card

**Location:** Second card (top-center)

**Verify:**
- [ ] Label says "Approved Components"
- [ ] Displays format: "X / Y" where X = approved, Y = total
- [ ] Approved count matches your Step 2.1 "Approved" value: ________
- [ ] Total count matches your Step 2.1 "Total" value: ________
- [ ] Font styling: large number for approved, smaller for total
- [ ] Numbers are properly formatted (no decimals)

**Record displayed value:** ________ / ________
**Expected value (from Step 2.1):** ________ / ________
**Match:** ☐ Yes ☐ No

#### 5.3 Critical Issues Card

**Location:** Third card (top-right)

**Verify:**
- [ ] Label says "Critical Issues"
- [ ] Displays a number (integer)
- [ ] Number color:
  - Green text if count = 0
  - Red text if count > 0
- [ ] Number is not negative

**Record displayed value:** ________
**Note:** Critical issues are calculated based on component quality, not directly from database

#### 5.4 Export Status Card

**Location:** Fourth card (bottom-right or far-right)

**Verify:**
- [ ] Label says "Export Status"
- [ ] Displays either "✓ Ready" or "! Not Ready"
- [ ] Status is "✓ Ready" (green) if:
  - No critical issues
  - At least one approved component
- [ ] Status is "! Not Ready" (yellow/red) if:
  - Critical issues exist OR
  - No approved components

**Record displayed status:** ☐ Ready ☐ Not Ready

### Step 6: Verify Component Status Breakdown

This section shows a visual progress bar and legend.

#### 6.1 Progress Bar

**Verify:**
- [ ] Progress bar is visible below the summary cards
- [ ] Bar has colored segments for each status:
  - Green = Approved
  - Yellow = Pending
  - Gray = Rejected
  - Red = Failed
- [ ] Segment widths are proportional to counts from Step 2.1
- [ ] No gaps or overlaps in the progress bar
- [ ] Bar is full width (100% total)

**Visual Check:** Use browser DevTools to inspect segment widths:
```javascript
// Open browser console (F12) and run:
document.querySelectorAll('.bg-green-500, .bg-yellow-500, .bg-gray-500, .bg-red-500').forEach(el => {
  console.log(el.className, el.style.width);
});
```

Calculate expected widths:
- Approved: (approved_count / total) × 100 = ________%
- Pending: (pending_count / total) × 100 = ________%
- Rejected: (rejected_count / total) × 100 = ________%
- Failed: (failed_count / total) × 100 = ________%

#### 6.2 Status Legend

**Verify:**
- [ ] Legend displays below progress bar
- [ ] 4 items with colored dots and counts:
  - 🟢 Approved: ________ (matches Step 2.1)
  - 🟡 Pending: ________ (matches Step 2.1)
  - ⚫ Rejected: ________ (matches Step 2.1)
  - 🔴 Failed: ________ (matches Step 2.1)
- [ ] All counts are integers (no decimals)
- [ ] Sum of all counts equals total from Step 2.1

### Step 7: Verify Accuracy Distribution

This section shows how many components fall into each accuracy range.

#### 7.1 Distribution Grid

**Verify:**
- [ ] Section heading says "Accuracy Distribution"
- [ ] 4 cards displayed in a grid:
  1. Excellent (90+%)
  2. Good (70-89%)
  3. Fair (50-69%)
  4. Poor (0-49%)
- [ ] Each card shows:
  - Label with range
  - Large number (count)
  - Appropriate color (green/blue/yellow/red)

#### 7.2 Counts Match Calculation

Compare displayed values to your calculations from Step 2.2:

| Range | Expected (from Step 2.2) | Displayed | Match? |
|-------|--------------------------|-----------|--------|
| Excellent (90+%) | ________ | ________ | ☐ Yes ☐ No |
| Good (70-89%) | ________ | ________ | ☐ Yes ☐ No |
| Fair (50-69%) | ________ | ________ | ☐ Yes ☐ No |
| Poor (0-49%) | ________ | ________ | ☐ Yes ☐ No |

**Verify:** Sum of all distribution counts equals total approved/evaluated components

### Step 8: Verify Issues and Recommendations

Quality reports detect issues automatically based on component quality.

#### 8.1 Critical Issues Section

**Look for a section titled "Critical Issues" with a red badge showing count**

**If critical issues exist (count > 0):**
- [ ] Section is visible
- [ ] Count badge matches Critical Issues card from Step 5.3
- [ ] Each issue displays:
  - Red border and background
  - Alert icon (circle with exclamation mark)
  - Title describing the issue
  - Category badge (Accuracy/Completeness/etc.)
  - Description text
  - Affected components list
  - Recommendation text

**Common critical issues:**
- "Low Accuracy Components" - When multiple components have accuracy < 50%
- "No Approved Components" - When no components are approved yet
- "Failed Component Generation" - When components failed to generate

**Record observed critical issues:**
1. ________________________________
2. ________________________________
3. ________________________________

#### 8.2 Warnings Section

**Look for a section titled "Warnings" with a yellow badge**

**If warnings exist:**
- [ ] Section is visible
- [ ] Each warning displays:
  - Yellow border and background
  - Warning triangle icon
  - Title, category, description
  - Affected components
  - Recommendation

**Common warnings:**
- "Pending Components" - When components await approval
- "Low Accuracy Components" - When some components have 50-69% accuracy
- "Rejected Components" - When some components were rejected

**Record observed warnings:**
1. ________________________________
2. ________________________________
3. ________________________________

#### 8.3 Recommendations Section

**Look for a section titled "Recommendations"**

**If recommendations exist:**
- [ ] Section is visible
- [ ] Each recommendation displays:
  - Blue border and background (info severity)
  - Info icon (circle with 'i')
  - Actionable advice
  - Category label
  - Recommendation text

**Common recommendations:**
- "Review Pending Components" - Suggests approving/rejecting pending items
- "Improve Component Accuracy" - Suggests regenerating or customizing low-accuracy components
- "Add SEO Metadata" - Suggests completing SEO form before export

**Record observed recommendations:**
1. ________________________________
2. ________________________________
3. ________________________________

#### 8.4 No Issues Message

**If NO issues or recommendations exist:**
- [ ] Success message displays:
  - Green border and background
  - Checkmark icon
  - "Everything looks great!" heading
  - "Your website is ready to export with no issues detected." text

### Step 9: Verify Data Consistency with Database

This is the critical verification step - ensuring UI matches database.

#### 9.1 Cross-Reference Accuracy Scores

For each component listed in Step 2.2, verify it's correctly reflected in the distribution:

**Example:**
- Component with 92.5% accuracy → Should count toward "Excellent (90+%)"
- Component with 88.3% accuracy → Should count toward "Good (70-89%)"
- Component with 60.0% accuracy → Should count toward "Fair (50-69%)"

**Verification method:**
```bash
# Count excellent components (accuracy >= 90)
sqlite3 data/website-cooker.db "
SELECT COUNT(*) FROM (
  SELECT c.id
  FROM components c
  LEFT JOIN component_variants v ON v.component_id = c.id AND v.variant_name = c.selected_variant
  WHERE c.website_id = 'YOUR_WEBSITE_ID_HERE'
    AND COALESCE(v.accuracy_score, 0) >= 90
);
"
```

Repeat for good (70-89), fair (50-69), poor (0-49).

**✓ Checkpoint:** All distribution counts match database query results

#### 9.2 Verify Component Status Counts

Re-run the status query from Step 2.1 and confirm counts still match:

```bash
sqlite3 data/website-cooker.db "
SELECT status, COUNT(*) FROM components
WHERE website_id = 'YOUR_WEBSITE_ID_HERE'
GROUP BY status;
"
```

**✓ Checkpoint:** Status breakdown matches database (no drift between page load and verification)

#### 9.3 Verify Average Accuracy Calculation

The displayed "Overall Accuracy" should be the arithmetic mean of all component accuracy scores:

**Manual calculation:**
1. Sum all accuracy scores from Step 2.2: ________
2. Divide by total component count: ________
3. Round to 1-2 decimal places: ________%

**Compare to displayed value from Step 5.1:** ________%

**✓ Checkpoint:** Displayed average matches manual calculation (within ±0.5% tolerance)

### Step 10: Test Dynamic Updates

Verify that the quality report updates when database state changes.

#### 10.1 Approve a Pending Component

1. Navigate back to dashboard or comparison page
2. Approve one pending component (if any exist)
3. Return to export page: `http://localhost:3000/export/YOUR_WEBSITE_ID_HERE`
4. Wait for quality report to reload

**Verify:**
- [ ] Approved count increased by 1
- [ ] Pending count decreased by 1
- [ ] Progress bar segments updated
- [ ] Overall accuracy may have changed
- [ ] Distribution counts may have changed

#### 10.2 Reject a Component

1. Reject one approved or pending component
2. Return to export page
3. Wait for reload

**Verify:**
- [ ] Rejected count increased by 1
- [ ] Source status count (approved or pending) decreased by 1
- [ ] Progress bar updated correctly
- [ ] Issues/recommendations may have changed

**✓ Checkpoint:** Quality report accurately reflects database changes in real-time

### Step 11: Browser Console Verification

Open browser DevTools (F12) and check the console:

**Verify:**
- [ ] No JavaScript errors
- [ ] No React hydration errors
- [ ] No missing props warnings
- [ ] API call to `/api/export/quality?websiteId=...` succeeded (status 200)
- [ ] Response JSON contains valid quality report data

**To inspect API response:**
1. Go to Network tab in DevTools
2. Refresh the page
3. Find the request to `/api/export/quality`
4. Click on it and view the "Response" tab
5. Verify JSON structure matches QualityReport type

**Required fields in response:**
```json
{
  "success": true,
  "report": {
    "websiteId": "...",
    "websiteName": "...",
    "generatedAt": "...",
    "qualityLevel": "excellent|good|fair|poor",
    "accuracy": {
      "overall": 85.5,
      "byComponentType": {...},
      "distribution": {
        "excellent": 3,
        "good": 2,
        "fair": 1,
        "poor": 0
      }
    },
    "componentStatus": {
      "approved": 5,
      "pending": 1,
      "rejected": 0,
      "failed": 0,
      "total": 6
    },
    "issues": [...],
    "recommendations": [...]
  }
}
```

### Step 12: Accessibility Verification

Test keyboard navigation and screen reader compatibility:

#### 12.1 Keyboard Navigation

1. Press Tab key repeatedly to navigate through quality report
2. Verify all interactive elements receive focus
3. Focus indicators are visible (blue outline or similar)

**Elements that should be keyboard-accessible:**
- [ ] Expand/collapse buttons (if any)
- [ ] Issue cards (if clickable)
- [ ] Links in recommendations

#### 12.2 ARIA Attributes

Inspect the quality report HTML and verify:
- [ ] Icons have `aria-hidden="true"` (decorative)
- [ ] Important status text is not icon-only
- [ ] Color is not the only indicator (text labels present)
- [ ] Section headings use proper HTML (`<h2>`, `<h3>`, etc.)

**Use DevTools to check:**
```javascript
// In browser console, check for aria-hidden on icons
document.querySelectorAll('svg').forEach(svg => {
  console.log('Icon aria-hidden:', svg.getAttribute('aria-hidden'));
});
```

**✓ Checkpoint:** Quality report is accessible via keyboard and screen readers

### Step 13: Responsive Design Verification

Test quality report layout at different screen sizes:

#### 13.1 Desktop (1920×1080)

**Verify:**
- [ ] Quality report in right sidebar (1/3 width)
- [ ] Summary cards in 2×2 grid or 4 columns
- [ ] Distribution cards in single row (4 columns)
- [ ] All text is readable
- [ ] No overflow or scrolling issues

#### 13.2 Tablet (768×1024)

**Resize browser window or use DevTools device emulation**

**Verify:**
- [ ] Quality report still visible
- [ ] Cards reflow to 2 columns
- [ ] Progress bar maintains full width
- [ ] No horizontal scrolling

#### 13.3 Mobile (375×667)

**Verify:**
- [ ] Quality report below main content (full width)
- [ ] Cards stack vertically (1 column)
- [ ] Text remains readable
- [ ] Touch targets are adequately sized (min 44×44px)
- [ ] No horizontal scrolling

**✓ Checkpoint:** Quality report is responsive across all screen sizes

---

## Expected Results

### ✅ Success Criteria

The test PASSES if all of the following are true:

1. **Display Verification:**
   - [x] Quality report section renders on export page
   - [x] All sub-sections display (header, summary, status, distribution, issues)
   - [x] No visual glitches or layout issues
   - [x] No JavaScript errors in console

2. **Data Accuracy:**
   - [x] Overall accuracy matches calculated average (within ±0.5%)
   - [x] Component status counts match database values exactly
   - [x] Approved components count matches database
   - [x] Distribution counts (excellent/good/fair/poor) match database
   - [x] Progress bar widths are proportional to status counts

3. **Issues and Recommendations:**
   - [x] Critical issues appear when quality problems exist
   - [x] Warnings appear for medium-severity issues
   - [x] Recommendations are actionable and relevant
   - [x] "No issues" message displays when quality is perfect

4. **Dynamic Updates:**
   - [x] Report updates when components are approved/rejected
   - [x] Counts and percentages recalculate correctly
   - [x] No stale data displayed

5. **User Experience:**
   - [x] Quality level badge color matches quality
   - [x] Visual indicators (colors, icons) are consistent
   - [x] Export status ("Ready"/"Not Ready") is accurate
   - [x] Keyboard navigation works
   - [x] Responsive design functions on all screen sizes

### ❌ Failure Scenarios

The test FAILS if any of these occur:

1. **Display Failures:**
   - Quality report section does not appear
   - Loading spinner never disappears
   - JavaScript errors in console prevent rendering
   - Missing sections or cards

2. **Data Mismatches:**
   - Overall accuracy differs from database by more than 0.5%
   - Component status counts don't match database
   - Distribution counts are incorrect
   - Progress bar segments don't sum to 100%

3. **Calculation Errors:**
   - Average accuracy calculation is wrong
   - Distribution categorization is incorrect (e.g., 95% marked as "Good" instead of "Excellent")
   - Status counts don't sum to total

4. **Logic Errors:**
   - "Ready" status shown when critical issues exist
   - "Not Ready" status shown when no issues exist
   - Issues not detected when they should be
   - Recommendations not actionable or relevant

5. **UX Issues:**
   - Report doesn't update after component approval
   - Stale data displayed (cached values don't refresh)
   - Layout breaks on mobile devices
   - Accessibility barriers prevent navigation

---

## Troubleshooting Guide

### Issue: Quality report not appearing

**Symptoms:** Loading spinner never goes away, or "No quality report available" message displays

**Possible Causes:**
1. Website not found in database
2. API route error
3. No components generated yet

**Solutions:**
```bash
# Check if website exists
sqlite3 data/website-cooker.db "SELECT * FROM websites WHERE id = 'YOUR_WEBSITE_ID';"

# Check if components exist
sqlite3 data/website-cooker.db "SELECT COUNT(*) FROM components WHERE website_id = 'YOUR_WEBSITE_ID';"

# Check API response in browser DevTools Network tab
# Look for /api/export/quality?websiteId=... request
# Check response status and error message
```

If no components exist, run the generation flow first.

### Issue: Counts don't match database

**Symptoms:** Displayed numbers differ from query results

**Possible Causes:**
1. Database updated between query and page load
2. Caching issue in API
3. Filtering logic error in quality-report.ts

**Solutions:**
```bash
# Re-run queries immediately before checking UI
# Use browser DevTools to inspect API response
# Compare response JSON to displayed values

# Clear browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Check if another process is modifying the database
# Look for concurrent generation jobs
```

### Issue: Accuracy calculation seems wrong

**Symptoms:** Overall accuracy doesn't match manual calculation

**Possible Causes:**
1. Null or missing accuracy scores counted as 0
2. Rounding differences
3. Only approved components counted vs. all components

**Solutions:**
```bash
# Check for null accuracy scores
sqlite3 data/website-cooker.db "
SELECT
  c.id,
  c.name,
  c.status,
  v.accuracy_score
FROM components c
LEFT JOIN component_variants v ON v.component_id = c.id AND v.variant_name = c.selected_variant
WHERE c.website_id = 'YOUR_WEBSITE_ID'
  AND (v.accuracy_score IS NULL OR v.accuracy_score = 0);
"

# Review quality-report.ts calculateAccuracy() function
# Check if it filters by status or includes all components
```

### Issue: Progress bar segments don't add to 100%

**Symptoms:** Gaps in progress bar or overlapping segments

**Possible Causes:**
1. CSS percentage calculation error
2. Rounding errors in width calculation
3. Missing status categories

**Solutions:**
```bash
# Inspect progress bar HTML in DevTools
# Check calculated widths
document.querySelectorAll('.h-full > div').forEach(el => {
  console.log(el.className, el.style.width, parseFloat(el.style.width));
});

# Sum should equal 100%
# If not, check componentStatus.total value
```

### Issue: Issues not appearing

**Symptoms:** Expected critical issues or warnings don't display

**Possible Causes:**
1. Issue detection thresholds too high
2. Logic error in detectIssues() function
3. Issues filtered out incorrectly

**Solutions:**
```bash
# Check API response for issues array
# In browser DevTools Network tab, find /api/export/quality response
# Inspect report.issues array

# Expected critical issues:
# - Low accuracy (<50%) on multiple components
# - No approved components
# - Failed component generation

# Review src/lib/export/quality-report.ts detectIssues() function
# Check thresholds and conditions
```

### Issue: API returns 404 or 500 error

**Symptoms:** "Failed to load quality report" error message

**Possible Causes:**
1. Website ID doesn't exist
2. Database connection error
3. Error in quality report generation

**Solutions:**
```bash
# Check server logs in terminal where npm run dev is running
# Look for error stack traces

# Verify DATABASE_PATH environment variable is set
echo $DATABASE_PATH

# Test database connection
sqlite3 $DATABASE_PATH "SELECT COUNT(*) FROM websites;"

# Check API route at src/app/api/export/quality/route.ts
# Add console.log statements for debugging
```

---

## Verification Checklist Summary

Use this quick checklist for final verification:

### Display
- [ ] Quality report section visible
- [ ] Header with quality level badge
- [ ] 4 summary cards displayed
- [ ] Component status progress bar
- [ ] Status legend
- [ ] Accuracy distribution grid
- [ ] Issues/recommendations sections

### Data Accuracy
- [ ] Overall accuracy matches database (±0.5%)
- [ ] Approved count matches database
- [ ] Pending count matches database
- [ ] Rejected count matches database
- [ ] Failed count matches database
- [ ] Total count is correct
- [ ] Excellent distribution count correct
- [ ] Good distribution count correct
- [ ] Fair distribution count correct
- [ ] Poor distribution count correct

### Functionality
- [ ] Quality level badge color appropriate
- [ ] Export status ("Ready"/"Not Ready") accurate
- [ ] Critical issues display when present
- [ ] Warnings display when present
- [ ] Recommendations display when present
- [ ] "No issues" message when quality perfect
- [ ] Report updates after component approval
- [ ] API call succeeds (status 200)

### User Experience
- [ ] No JavaScript errors
- [ ] No layout issues
- [ ] Responsive on mobile
- [ ] Keyboard navigation works
- [ ] ARIA attributes present
- [ ] Colors provide sufficient contrast
- [ ] Text is readable

---

## Success Declaration

Once all checkboxes above are marked, the integration test is **COMPLETE** and **PASSING**.

**Sign-off:**
- Test Date: _______________
- Tester: _______________
- Website ID Used: _______________
- Overall Result: ☐ PASS ☐ FAIL
- Notes: _______________________________________________

---

## Next Steps After Test

1. **If test PASSES:**
   - Update implementation_plan.json: Set subtask-6-3 status to "completed"
   - Commit changes:
     ```bash
     git add .
     git commit -m "auto-claude: subtask-6-3 - Integration test: Verify quality report displays accurate metrics"
     ```
   - Proceed to next subtask or final QA

2. **If test FAILS:**
   - Document failures in build-progress.txt
   - Identify root cause using troubleshooting guide
   - Fix issues in quality-report.ts or QualityReportView.tsx
   - Re-run test from Step 1

3. **For production deployment:**
   - Add automated E2E test covering this flow
   - Consider adding database fixtures for consistent testing
   - Implement monitoring for quality report API latency
   - Add error tracking for quality report generation failures

---

## Related Files

- **Export Page:** `src/app/export/[id]/page.tsx`
- **Quality Report Component:** `src/components/Export/QualityReportView.tsx`
- **Quality Report Logic:** `src/lib/export/quality-report.ts`
- **API Route:** `src/app/api/export/quality/route.ts`
- **Database Schema:** `src/lib/db/schema.ts`
- **Database Client:** `src/lib/db/client.ts`

---

**End of Integration Test Document**
