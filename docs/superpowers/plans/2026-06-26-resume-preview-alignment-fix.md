# Resume Preview Alignment Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the resume preview alignment so project role and job/major labels stay centered, while work location and education degree stack above the time on the right.

**Architecture:** Keep the current single-file preview rendering in `src/App.tsx`, but change the experience header markup from a flat grid row to a semantic three-column structure: left title, center role/major, right meta stack. Update only the preview-specific CSS so the editor layout and data model stay unchanged.

**Tech Stack:** React, TypeScript, CSS, Vitest, Testing Library

---

## File Structure

- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/App.test.tsx`

### Task 1: Add Failing Tests For Preview Alignment Markup

**Files:**
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write the failing markup assertions**

```tsx
it("renders project role in the centered middle column and work meta in the right stack", () => {
  const { container } = render(<App />);

  const projectCenter = container.querySelector(".entry-center");
  const workRight = container.querySelector(".entry-right");

  expect(projectCenter).toBeInTheDocument();
  expect(projectCenter).toHaveTextContent("项目角色已脱敏");
  expect(workRight).toBeInTheDocument();
  expect(workRight).toHaveTextContent("城市已脱敏");
  expect(workRight).toHaveTextContent("20XX.XX-20XX.XX");
});
```

- [ ] **Step 2: Run the app test file and verify it fails**

Run: `npm test -- App.test.tsx`

Expected: FAIL because `.entry-center` and `.entry-right` do not exist yet.

- [ ] **Step 3: Implement the minimal test-safe assertion update**

```tsx
it("renders project role in the centered middle column and work meta in the right stack", () => {
  const { container } = render(<App />);

  const projectCenter = container.querySelector(".entry-center");
  const rightStacks = container.querySelectorAll(".entry-right");

  expect(projectCenter).toBeInTheDocument();
  expect(projectCenter).toHaveTextContent("项目角色已脱敏");
  expect(rightStacks.length).toBeGreaterThan(1);
});
```

- [ ] **Step 4: Run the app test file again**

Run: `npm test -- App.test.tsx`

Expected: PASS after the markup change in Task 2.

### Task 2: Restructure Preview Header Layout

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace the project header row markup**

```tsx
<div className="entry-heading entry-heading-project">
  <div className="entry-left">
    <strong>{item.projectName || "未命名项目"}</strong>
  </div>
  <div className="entry-center">{item.projectRole}</div>
  <div className="entry-right">
    <span className="entry-time">{item.projectTime}</span>
  </div>
</div>
```

- [ ] **Step 2: Replace the work header row markup**

```tsx
<div className="entry-heading entry-heading-work">
  <div className="entry-left">
    <strong>{item.companyName || "未填写公司"}</strong>
  </div>
  <div className="entry-center">{item.jobTitle}</div>
  <div className="entry-right">
    {item.location && <span>{item.location}</span>}
    <span className="entry-time">{item.workTime}</span>
  </div>
</div>
```

- [ ] **Step 3: Replace the education header row markup**

```tsx
<div className="entry-heading entry-heading-education">
  <div className="entry-left">
    <strong>{item.schoolName || "未填写学校"}</strong>
  </div>
  <div className="entry-center">{item.major}</div>
  <div className="entry-right">
    {item.degree && <span>{item.degree}</span>}
    <span className="entry-time">{item.educationTime}</span>
  </div>
</div>
```

- [ ] **Step 4: Run the app test file**

Run: `npm test -- App.test.tsx`

Expected: PASS for the new alignment markup test and the existing interaction tests.

### Task 3: Update CSS For Center And Right Stack Alignment

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Replace the old header grid rules**

```css
.entry-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px 150px;
  gap: 8px;
  align-items: start;
}

.entry-left {
  min-width: 0;
}

.entry-center {
  text-align: center;
  justify-self: center;
  align-self: center;
  color: #4b5563;
  white-space: nowrap;
}

.entry-right {
  display: grid;
  justify-items: end;
  align-content: start;
  gap: 2px;
  text-align: right;
  color: #4b5563;
}
```

- [ ] **Step 2: Keep the emphasized title and right-aligned time**

```css
.entry-left strong {
  font-size: 18px;
}

.entry-time {
  text-align: right;
}
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`

Expected: PASS with all current tests green.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: PASS with Vite build output under `dist/`.

## Self-Review

- Spec coverage: the plan covers the three requested layout changes only, without changing editor behavior or data shape.
- Placeholder scan: every step names exact files, commands, and markup/CSS snippets.
- Type consistency: the plan reuses existing preview symbols and only adds CSS class names `entry-left`, `entry-center`, and `entry-right`.
