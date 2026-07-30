# Light Layout Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight preview layout mode with per-entry draggable middle labels, snapping guides, grid overlay, local persistence, and print-safe export behavior.

**Architecture:** Extend the existing preview rendering in `src/App.tsx` instead of rewriting the editor. Add a small layout state layer keyed by entry ids, wrap the three target fields with draggable preview labels, and render a preview overlay for grid and guides inside the resume paper so exported PDF keeps the final positions but hides editing aids.

**Tech Stack:** React, TypeScript, CSS, localStorage, Vitest, Testing Library

---

## File Structure

- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/App.test.tsx`
- Modify: `src/types/resume.ts`
- Modify: `src/utils/resume.ts`

### Task 1: Add Failing Tests For Layout Mode

**Files:**
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add failing tests for toolbar, local grid toggle, and draggable labels**

```tsx
it("shows layout controls and toggles the grid overlay", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: "开启排版模式" }));
  await user.click(screen.getByRole("button", { name: "显示网格线" }));

  expect(screen.getByText("重置排版")).toBeInTheDocument();
  expect(screen.getByTestId("preview-grid")).toBeInTheDocument();
});

it("renders draggable labels for the three supported middle fields", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: "开启排版模式" }));

  expect(screen.getByTestId("draggable-project-role-project-1")).toBeInTheDocument();
  expect(screen.getByTestId("draggable-work-title-work-1")).toBeInTheDocument();
  expect(screen.getByTestId("draggable-education-major-education-1")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the app test file and verify it fails**

Run: `npm test -- App.test.tsx`

Expected: FAIL because the layout toolbar, grid overlay, and draggable label test ids do not exist yet.

### Task 2: Add Layout State And Persistence Helpers

**Files:**
- Modify: `src/types/resume.ts`
- Modify: `src/utils/resume.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Extend the shared types**

```ts
export type LayoutBlockKind = "project-role" | "work-title" | "education-major";

export type LayoutBlockState = {
  x: number;
  y: number;
};

export type LayoutState = {
  layoutMode: boolean;
  showGrid: boolean;
  blocks: Record<string, LayoutBlockState>;
};
```

- [ ] **Step 2: Add persistence and snapping helpers**

```ts
export const LAYOUT_STORAGE_KEY = "resume-layout-state";
export const GRID_SIZE = 8;
export const SNAP_THRESHOLD = 8;

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
```

- [ ] **Step 3: Add localStorage-backed layout state in `App.tsx`**

```tsx
const DEFAULT_LAYOUT_STATE: LayoutState = {
  layoutMode: false,
  showGrid: false,
  blocks: {}
};

const [layoutState, setLayoutState] = useState<LayoutState>(() => {
  const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
  return raw ? { ...DEFAULT_LAYOUT_STATE, ...JSON.parse(raw) } : DEFAULT_LAYOUT_STATE;
});
```

- [ ] **Step 4: Persist layout state after updates**

```tsx
useEffect(() => {
  window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutState));
}, [layoutState]);
```

- [ ] **Step 5: Run the app test file again**

Run: `npm test -- App.test.tsx`

Expected: still FAIL because draggable preview UI is not wired yet.

### Task 3: Implement Layout Toolbar, Grid Overlay, And Draggable Labels

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add a lightweight toolbar above the preview**

```tsx
<div className="layout-toolbar">
  <button type="button" onClick={toggleLayoutMode}>
    {layoutState.layoutMode ? "关闭排版模式" : "开启排版模式"}
  </button>
  <button type="button" onClick={toggleGrid} disabled={!layoutState.layoutMode}>
    {layoutState.showGrid ? "隐藏网格线" : "显示网格线"}
  </button>
  <button type="button" onClick={resetLayout}>
    重置排版
  </button>
</div>
```

- [ ] **Step 2: Add the preview canvas wrapper and grid overlay**

```tsx
<div className={`preview-canvas${layoutState.layoutMode ? " is-layout-mode" : ""}`}>
  {layoutState.layoutMode && layoutState.showGrid && (
    <div className="preview-grid" data-testid="preview-grid" />
  )}
  <ResumePreview
    data={resumeData}
    sectionOrder={sectionOrder}
    layoutState={layoutState}
    onBlockMove={handleBlockMove}
  />
</div>
```

- [ ] **Step 3: Add a reusable draggable label wrapper inside `App.tsx`**

```tsx
function DraggableLabel({
  blockId,
  className,
  children,
  layoutState,
  onMove
}: DraggableLabelProps) {
  const offset = layoutState.blocks[blockId] ?? { x: 0, y: 0 };
  return (
    <div
      data-testid={`draggable-${blockId}`}
      className={`${className} draggable-label${layoutState.layoutMode ? " is-active" : ""}`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      onPointerDown={(event) => startDrag(event, blockId)}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Wrap the three target middle fields**

```tsx
<DraggableLabel
  blockId={`project-role-${item.id}`}
  className="entry-center"
  layoutState={layoutState}
  onMove={onBlockMove}
>
  {item.projectRole}
</DraggableLabel>
```

Apply the same pattern to:

- `work-title-${item.id}`
- `education-major-${item.id}`

- [ ] **Step 5: Add minimal drag styles and print exclusions**

```css
.layout-toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.preview-canvas {
  position: relative;
}

.preview-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, rgba(37, 99, 235, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(37, 99, 235, 0.08) 1px, transparent 1px);
  background-size: 8px 8px;
}

.draggable-label.is-active {
  position: relative;
  cursor: move;
  outline: 1px dashed rgba(37, 99, 235, 0.6);
}

@media print {
  .layout-toolbar,
  .preview-grid,
  .guide-overlay,
  .draggable-label.is-active {
    display: none !important;
  }
}
```

- [ ] **Step 6: Run the app tests and verify the new tests pass**

Run: `npm test -- App.test.tsx`

Expected: PASS for toolbar and draggable label tests.

### Task 4: Add Snapping, Guides, And Layout Reset

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Implement bounded pointer drag with snapping**

```tsx
function updateBlockPosition(blockId: string, nextX: number, nextY: number) {
  setLayoutState((current) => ({
    ...current,
    blocks: {
      ...current.blocks,
      [blockId]: {
        x: snapToGrid(clampValue(nextX, -120, 120)),
        y: snapToGrid(clampValue(nextY, -60, 60))
      }
    }
  }));
}
```

- [ ] **Step 2: Add guide overlay state for active drag**

```tsx
const [activeGuide, setActiveGuide] = useState<{ x: number; y: number } | null>(null);

{layoutState.layoutMode && activeGuide && (
  <div className="guide-overlay">
    <div className="guide-line guide-line-x" style={{ top: activeGuide.y }} />
    <div className="guide-line guide-line-y" style={{ left: activeGuide.x }} />
  </div>
)}
```

- [ ] **Step 3: Add a reset action that clears offsets but keeps preferences**

```tsx
function resetLayout() {
  setLayoutState((current) => ({
    ...current,
    blocks: {}
  }));
}
```

- [ ] **Step 4: Run the full test suite**

Run: `npm test`

Expected: PASS with all current tests green.

### Task 5: Final Verification

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Ensure newly added entries can compute stable block ids**

```tsx
const projectBlockId = `project-role-${item.id}`;
const workBlockId = `work-title-${item.id}`;
const educationBlockId = `education-major-${item.id}`;
```

- [ ] **Step 2: Ensure deleted entries do not break preview rendering**

```tsx
const activeBlockIds = new Set([
  ...data.projects.map((item) => `project-role-${item.id}`),
  ...data.workExperiences.map((item) => `work-title-${item.id}`),
  ...data.educations.map((item) => `education-major-${item.id}`)
]);
```

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: PASS with a production bundle ready under `dist/`.

- [ ] **Step 4: Start the dev server for manual review**

Run: `npm run dev -- --host 127.0.0.1 --port 4173`

Expected: Vite starts and prints a `http://127.0.0.1:` preview URL.

## Self-Review

- Spec coverage: the plan covers toolbar controls, draggable middle labels, snapping, grid/guides, local persistence, and print-safe export behavior.
- Placeholder scan: each task uses explicit files, commands, and implementation snippets.
- Type consistency: `LayoutState`, `LayoutBlockState`, `layoutMode`, `showGrid`, and per-entry block ids are named consistently across tasks.
