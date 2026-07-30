# Resume Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local single-page resume editor with structured forms on the left, live preview on the right, drag-reorder for top-level sections, and browser PDF export.

**Architecture:** Create a Vite + React + TypeScript app in the repo root. Keep state in a page-level reducer so content updates and section reordering stay separate, render the preview from normalized data, and use print CSS plus `window.print()` for export. Use `@dnd-kit/sortable` only for top-level section drag-and-drop, and keep item-level ordering inside forms as explicit up/down actions.

**Tech Stack:** React 18, TypeScript, Vite 5, Vitest, Testing Library, `@dnd-kit/core`, `@dnd-kit/sortable`

---

## File Structure

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/types/resume.ts`
- Create: `src/data/defaultResume.ts`
- Create: `src/utils/resume.ts`
- Create: `src/components/SectionCard.tsx`
- Create: `src/components/SectionSorter.tsx`
- Create: `src/components/forms/BasicInfoForm.tsx`
- Create: `src/components/forms/CoreStrengthsForm.tsx`
- Create: `src/components/forms/ProjectExperienceForm.tsx`
- Create: `src/components/forms/WorkExperienceForm.tsx`
- Create: `src/components/forms/EducationForm.tsx`
- Create: `src/components/forms/SkillsForm.tsx`
- Create: `src/components/forms/OtherInfoForm.tsx`
- Create: `src/components/preview/ResumePreview.tsx`
- Create: `src/components/preview/PreviewSection.tsx`
- Create: `src/components/ExportActions.tsx`
- Create: `src/test/setup.ts`
- Create: `src/utils/resume.test.ts`
- Create: `src/App.test.tsx`

### Task 1: Scaffold The Frontend Workspace

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write the failing app smoke test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the resume editor shell", () => {
    render(<App />);

    expect(screen.getByText("简历模块化编辑工具")).toBeInTheDocument();
    expect(screen.getByText("栏目顺序")).toBeInTheDocument();
    expect(screen.getByText("简历预览")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Create the package and toolchain files**

```json
{
  "name": "resume-editor",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/modifiers": "^9.0.0",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  }
}
```

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts"
  }
});
```

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>简历模块化编辑工具</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Add the initial app shell and test setup**

```ts
import "@testing-library/jest-dom/vitest";
```

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```tsx
export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>简历模块化编辑工具</h1>
          <p>左侧编辑内容，右侧实时预览，支持大板块拖拽和 PDF 导出。</p>
        </div>
      </header>

      <main className="layout">
        <aside className="editor-column">
          <section className="panel">
            <h2>栏目顺序</h2>
          </section>
          <section className="panel">
            <h2>编辑内容</h2>
          </section>
        </aside>

        <section className="preview-column">
          <div className="preview-header">
            <h2>简历预览</h2>
          </div>
        </section>
      </main>
    </div>
  );
}
```

```css
:root {
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #1f2937;
  background: #eef2f7;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 1280px;
}

#root {
  min-height: 100vh;
}

.app-shell {
  padding: 24px;
}

.topbar {
  margin-bottom: 20px;
}

.topbar h1,
.panel h2,
.preview-header h2 {
  margin: 0;
}

.topbar p {
  margin: 8px 0 0;
  color: #4b5563;
}

.layout {
  display: grid;
  grid-template-columns: 420px minmax(720px, 1fr);
  gap: 20px;
  align-items: start;
}

.editor-column,
.preview-column {
  display: grid;
  gap: 16px;
}

.panel,
.preview-header {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #dbe2ea;
  padding: 18px;
}
```

- [ ] **Step 4: Install dependencies and verify the test fails before implementation is complete**

Run: `npm install`

Expected: install finishes with added packages and zero fatal errors.

Run: `npm test`

Expected: FAIL because `栏目顺序` and `简历预览` exist, but the rest of the editor behavior is still missing from later tasks.

- [ ] **Step 5: Run the smoke test again after the shell exists**

Run: `npm test -- App.test.tsx`

Expected: PASS with one passing test for the shell render.

### Task 2: Add Resume Types, Seed Data, And Pure State Helpers

**Files:**
- Create: `src/types/resume.ts`
- Create: `src/data/defaultResume.ts`
- Create: `src/utils/resume.ts`
- Test: `src/utils/resume.test.ts`

- [ ] **Step 1: Write failing utility tests for section order and visibility**

```ts
import { describe, expect, it } from "vitest";
import { defaultResumeData, defaultSectionOrder } from "../data/defaultResume";
import {
  hasVisibleContent,
  moveArrayItem,
  updateArrayItem,
  visibleSections
} from "./resume";

describe("resume helpers", () => {
  it("moves a top-level section in the order array", () => {
    expect(moveArrayItem(defaultSectionOrder, 1, 0)).toEqual([
      "projects",
      "coreStrengths",
      "workExperiences",
      "educations",
      "skills",
      "others"
    ]);
  });

  it("updates an item in a repeatable section", () => {
    const next = updateArrayItem(defaultResumeData.projects, 0, {
      projectName: "升级后的项目"
    });

    expect(next[0].projectName).toBe("升级后的项目");
    expect(next[0].projectRole).toBe(defaultResumeData.projects[0].projectRole);
  });

  it("hides empty sections from the preview", () => {
    const emptyData = {
      ...defaultResumeData,
      others: [],
      coreStrengths: []
    };

    expect(hasVisibleContent(emptyData, "others")).toBe(false);
    expect(visibleSections(emptyData, defaultSectionOrder)).not.toContain("others");
    expect(visibleSections(emptyData, defaultSectionOrder)).not.toContain("coreStrengths");
  });
});
```

- [ ] **Step 2: Define the core resume types**

```ts
export type SectionKey =
  | "coreStrengths"
  | "projects"
  | "workExperiences"
  | "educations"
  | "skills"
  | "others";

export type BasicInfo = {
  name: string;
  phone: string;
  email: string;
  wechat: string;
};

export type ProjectItem = {
  id: string;
  projectName: string;
  projectRole: string;
  projectTime: string;
  projectSummary: string;
  projectHighlights: string[];
  tools: string;
};

export type WorkItem = {
  id: string;
  companyName: string;
  jobTitle: string;
  location: string;
  workTime: string;
  responsibilities: string[];
};

export type EducationItem = {
  id: string;
  schoolName: string;
  major: string;
  degree: string;
  educationTime: string;
  notes: string[];
};

export type Skills = {
  languages: string[];
  tools: string[];
  interests: string[];
};

export type ResumeData = {
  basicInfo: BasicInfo;
  coreStrengths: string[];
  projects: ProjectItem[];
  workExperiences: WorkItem[];
  educations: EducationItem[];
  skills: Skills;
  others: string[];
};
```

- [ ] **Step 3: Add realistic starter data that matches the Chinese resume layout**

```ts
import type { ResumeData, SectionKey } from "../types/resume";

export const defaultSectionOrder: SectionKey[] = [
  "coreStrengths",
  "projects",
  "workExperiences",
  "educations",
  "skills",
  "others"
];

export const defaultResumeData: ResumeData = {
  basicInfo: {
    name: "候选人",
    phone: "1**-****-****",
    email: "candidate@example.com",
    wechat: "wechat_redacted"
  },
  coreStrengths: [
    "行政统筹与空间管理",
    "商务接待（政府/企业）",
    "跨部门协调与会务组织",
    "物资管理",
    "流程优化"
  ],
  projects: [
    {
      id: "project-1",
      projectName: "项目名称已脱敏",
      projectRole: "项目角色已脱敏",
      projectTime: "20XX.XX-20XX.XX",
      projectSummary: "项目背景、合作对象和落地范围已脱敏。",
      projectHighlights: [
        "完成方案设计、资源协调和阶段复盘",
        "推进跨部门沟通并支持项目落地",
        "沉淀流程文档并推动后续优化"
      ],
      tools: "Excel, PPT, 台账管理"
    }
  ],
  workExperiences: [
    {
      id: "work-1",
      companyName: "工作单位已脱敏",
      jobTitle: "岗位名称已脱敏",
      location: "城市已脱敏",
      workTime: "20XX.XX-20XX.XX",
      responsibilities: [
        "统筹项目对接、巡查和日常维护",
        "负责内外部联络与活动组织，推进重点诉求解决",
        "建立台账和标准化管理机制"
      ]
    }
  ],
  educations: [
    {
      id: "education-1",
      schoolName: "学校名称已脱敏",
      major: "专业已脱敏",
      degree: "本科",
      educationTime: "20XX.XX-20XX.XX",
      notes: [
        "参与校园活动统筹与组织",
        "负责对外联络与协作支持"
      ]
    }
  ],
  skills: {
    languages: ["英语 CET-6"],
    tools: ["Office", "Excel 数据透视", "PPT 可视化", "视频剪辑"],
    interests: ["瑜伽", "登山等户外运动"]
  },
  others: ["可根据岗位需求调整简历重点模块顺序"]
};
```

- [ ] **Step 4: Implement the pure helper utilities**

```ts
import type { ResumeData, SectionKey } from "../types/resume";

export function moveArrayItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function updateArrayItem<T extends object>(
  items: T[],
  index: number,
  patch: Partial<T>
): T[] {
  return items.map((item, currentIndex) =>
    currentIndex === index ? { ...item, ...patch } : item
  );
}

export function hasVisibleContent(data: ResumeData, key: SectionKey): boolean {
  if (key === "coreStrengths") return data.coreStrengths.some(Boolean);
  if (key === "projects") return data.projects.length > 0;
  if (key === "workExperiences") return data.workExperiences.length > 0;
  if (key === "educations") return data.educations.length > 0;
  if (key === "skills") {
    return (
      data.skills.languages.length > 0 ||
      data.skills.tools.length > 0 ||
      data.skills.interests.length > 0
    );
  }

  return data.others.length > 0;
}

export function visibleSections(data: ResumeData, order: SectionKey[]): SectionKey[] {
  return order.filter((key) => hasVisibleContent(data, key));
}
```

- [ ] **Step 5: Run focused tests for the helpers**

Run: `npm test -- resume.test.ts`

Expected: PASS with utility tests covering reorder, update, and empty-section filtering.

### Task 3: Build The Editor Forms And The Top-Level Section Sorter

**Files:**
- Create: `src/components/SectionCard.tsx`
- Create: `src/components/SectionSorter.tsx`
- Create: `src/components/forms/BasicInfoForm.tsx`
- Create: `src/components/forms/CoreStrengthsForm.tsx`
- Create: `src/components/forms/ProjectExperienceForm.tsx`
- Create: `src/components/forms/WorkExperienceForm.tsx`
- Create: `src/components/forms/EducationForm.tsx`
- Create: `src/components/forms/SkillsForm.tsx`
- Create: `src/components/forms/OtherInfoForm.tsx`
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Expand the app test to cover editing and drag-order feedback**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the resume editor shell", () => {
    render(<App />);

    expect(screen.getByText("简历模块化编辑工具")).toBeInTheDocument();
    expect(screen.getByText("栏目顺序")).toBeInTheDocument();
    expect(screen.getByText("简历预览")).toBeInTheDocument();
  });

  it("syncs form input into the preview", async () => {
    const user = userEvent.setup();
    render(<App />);

    const nameInput = screen.getByLabelText("姓名");
    await user.clear(nameInput);
    await user.type(nameInput, "王敏");

    expect(screen.getByText("王敏")).toBeInTheDocument();
  });

  it("exports to print when clicking the PDF button", async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(<App />);
    await user.click(screen.getByRole("button", { name: "导出 PDF" }));

    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Create shared card and top-level sorter components**

```tsx
type SectionCardProps = {
  title: string;
  children: React.ReactNode;
};

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section className="panel section-card">
      <h2>{title}</h2>
      <div className="section-card-body">{children}</div>
    </section>
  );
}
```

```tsx
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SectionKey } from "../types/resume";

const LABELS: Record<SectionKey, string> = {
  coreStrengths: "核心优势",
  projects: "项目经历",
  workExperiences: "工作经历",
  educations: "教育经历",
  skills: "相关技能",
  others: "其他信息"
};

type SorterProps = {
  order: SectionKey[];
  onChange: (next: SectionKey[]) => void;
};

function SortableItem({ id }: { id: SectionKey }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      className="sort-item"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button type="button" className="drag-handle" {...attributes} {...listeners}>
        :: 
      </button>
      <span>{LABELS[id]}</span>
    </li>
  );
}

export function SectionSorter({ order, onChange }: SorterProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.indexOf(active.id as SectionKey);
    const newIndex = order.indexOf(over.id as SectionKey);
    onChange(arrayMove(order, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ul className="sort-list">
          {order.map((key) => (
            <SortableItem key={key} id={key} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
```

- [ ] **Step 3: Create the individual form components**

```tsx
import type { BasicInfo } from "../../types/resume";

type BasicInfoFormProps = {
  value: BasicInfo;
  onChange: (next: BasicInfo) => void;
};

export function BasicInfoForm({ value, onChange }: BasicInfoFormProps) {
  return (
    <div className="form-grid">
      <label>
        姓名
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
        />
      </label>
      <label>
        电话
        <input
          value={value.phone}
          onChange={(event) => onChange({ ...value, phone: event.target.value })}
        />
      </label>
      <label>
        邮箱
        <input
          value={value.email}
          onChange={(event) => onChange({ ...value, email: event.target.value })}
        />
      </label>
      <label>
        微信
        <input
          value={value.wechat}
          onChange={(event) => onChange({ ...value, wechat: event.target.value })}
        />
      </label>
    </div>
  );
}
```

```tsx
type StringListFormProps = {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
};

export function CoreStrengthsForm({ label, items, onChange }: StringListFormProps) {
  return (
    <div className="stack-list">
      {items.map((item, index) => (
        <label key={`${label}-${index}`}>
          {label} {index + 1}
          <input
            value={item}
            onChange={(event) =>
              onChange(items.map((current, currentIndex) =>
                currentIndex === index ? event.target.value : current
              ))
            }
          />
        </label>
      ))}
      <button type="button" onClick={() => onChange([...items, ""])}>
        新增一条
      </button>
    </div>
  );
}
```

```tsx
import type { EducationItem, ProjectItem, WorkItem } from "../../types/resume";

type ProjectExperienceFormProps = {
  items: ProjectItem[];
  onChange: (items: ProjectItem[]) => void;
};

type WorkExperienceFormProps = {
  items: WorkItem[];
  onChange: (items: WorkItem[]) => void;
};

type EducationFormProps = {
  items: EducationItem[];
  onChange: (items: EducationItem[]) => void;
};

const emptyProject = (): ProjectItem => ({
  id: crypto.randomUUID(),
  projectName: "",
  projectRole: "",
  projectTime: "",
  projectSummary: "",
  projectHighlights: [""],
  tools: ""
});
```

Implement the remaining form files with the same pattern:

- map over items
- render labeled inputs and textareas for each field
- render bullet-list editors for `projectHighlights`, `responsibilities`, and `notes`
- add `新增一条`, `删除`, `上移`, `下移` buttons
- call `onChange` with cloned arrays only

- [ ] **Step 4: Wire the forms and sorter into `App.tsx`**

```tsx
import { useMemo, useState } from "react";
import { defaultResumeData, defaultSectionOrder } from "./data/defaultResume";
import { SectionCard } from "./components/SectionCard";
import { SectionSorter } from "./components/SectionSorter";
import { BasicInfoForm } from "./components/forms/BasicInfoForm";
import { CoreStrengthsForm } from "./components/forms/CoreStrengthsForm";

export default function App() {
  const [resumeData, setResumeData] = useState(defaultResumeData);
  const [sectionOrder, setSectionOrder] = useState(defaultSectionOrder);

  const editorSummary = useMemo(
    () => `${resumeData.basicInfo.name} - ${sectionOrder.join(",")}`,
    [resumeData, sectionOrder]
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>简历模块化编辑工具</h1>
          <p>左侧编辑内容，右侧实时预览，支持大板块拖拽和 PDF 导出。</p>
        </div>
      </header>

      <main className="layout">
        <aside className="editor-column">
          <SectionCard title="栏目顺序">
            <p className="helper-text">基本信息固定置顶，以下一级栏目支持拖拽调整顺序。</p>
            <SectionSorter order={sectionOrder} onChange={setSectionOrder} />
          </SectionCard>

          <SectionCard title="基本信息">
            <BasicInfoForm
              value={resumeData.basicInfo}
              onChange={(basicInfo) => setResumeData((current) => ({ ...current, basicInfo }))}
            />
          </SectionCard>

          <SectionCard title="核心优势">
            <CoreStrengthsForm
              label="优势要点"
              items={resumeData.coreStrengths}
              onChange={(coreStrengths) =>
                setResumeData((current) => ({ ...current, coreStrengths }))
              }
            />
          </SectionCard>

          <div hidden>{editorSummary}</div>
        </aside>

        <section className="preview-column">
          <div className="preview-header">
            <h2>简历预览</h2>
          </div>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Run the app test suite to verify editing works**

Run: `npm test -- App.test.tsx`

Expected: PASS for shell render, input sync, and PDF button test once Task 4 adds the export button.

### Task 4: Render The Resume Preview And Print Export

**Files:**
- Create: `src/components/preview/PreviewSection.tsx`
- Create: `src/components/preview/ResumePreview.tsx`
- Create: `src/components/ExportActions.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Add the preview section wrapper and the export button**

```tsx
type PreviewSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function PreviewSection({ title, children }: PreviewSectionProps) {
  return (
    <section className="resume-section">
      <h3>{title}</h3>
      <div className="resume-section-body">{children}</div>
    </section>
  );
}
```

```tsx
type ExportActionsProps = {
  onExport: () => void;
};

export function ExportActions({ onExport }: ExportActionsProps) {
  return (
    <div className="export-actions">
      <button type="button" className="primary-button" onClick={onExport}>
        导出 PDF
      </button>
      <p>使用浏览器打印能力导出，打印时仅保留右侧简历页面。</p>
    </div>
  );
}
```

- [ ] **Step 2: Implement the preview renderer from normalized state**

```tsx
import type { ResumeData, SectionKey } from "../../types/resume";
import { visibleSections } from "../../utils/resume";
import { PreviewSection } from "./PreviewSection";

const TITLES: Record<SectionKey, string> = {
  coreStrengths: "核心优势",
  projects: "项目经历",
  workExperiences: "工作经历",
  educations: "教育经历",
  skills: "相关技能",
  others: "其他信息"
};

type ResumePreviewProps = {
  data: ResumeData;
  sectionOrder: SectionKey[];
};

export function ResumePreview({ data, sectionOrder }: ResumePreviewProps) {
  const sections = visibleSections(data, sectionOrder);

  return (
    <article className="resume-paper" aria-label="resume-preview">
      <header className="resume-header">
        <h1>{data.basicInfo.name}</h1>
        <p>
          电话: {data.basicInfo.phone} | 邮箱: {data.basicInfo.email} | 微信: {data.basicInfo.wechat}
        </p>
      </header>

      {sections.map((key) => (
        <PreviewSection key={key} title={TITLES[key]}>
          {key === "coreStrengths" && <p>{data.coreStrengths.join(" | ")}</p>}
          {key === "projects" &&
            data.projects.map((item) => (
              <div key={item.id} className="resume-entry">
                <div className="entry-heading">
                  <strong>{item.projectName}</strong>
                  <span>{item.projectRole}</span>
                  <span>{item.projectTime}</span>
                </div>
                <p>{item.projectSummary}</p>
                {item.tools && <p className="entry-tools">工具: {item.tools}</p>}
                <ul>
                  {item.projectHighlights.filter(Boolean).map((line, index) => (
                    <li key={`${item.id}-${index}`}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          {key === "workExperiences" &&
            data.workExperiences.map((item) => (
              <div key={item.id} className="resume-entry">
                <div className="entry-heading">
                  <strong>{item.companyName}</strong>
                  <span>{item.jobTitle}</span>
                  <span>{item.location}</span>
                  <span>{item.workTime}</span>
                </div>
                <ul>
                  {item.responsibilities.filter(Boolean).map((line, index) => (
                    <li key={`${item.id}-${index}`}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          {key === "educations" &&
            data.educations.map((item) => (
              <div key={item.id} className="resume-entry">
                <div className="entry-heading">
                  <strong>{item.schoolName}</strong>
                  <span>{item.major}</span>
                  <span>{item.degree}</span>
                  <span>{item.educationTime}</span>
                </div>
                {item.notes.length > 0 && (
                  <ul>
                    {item.notes.filter(Boolean).map((line, index) => (
                      <li key={`${item.id}-${index}`}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          {key === "skills" && (
            <div className="skills-block">
              <p>语言: {data.skills.languages.join("，")}</p>
              <p>技能: {data.skills.tools.join("，")}</p>
              <p>爱好: {data.skills.interests.join("，")}</p>
            </div>
          )}
          {key === "others" && (
            <ul>
              {data.others.filter(Boolean).map((line, index) => (
                <li key={`other-${index}`}>{line}</li>
              ))}
            </ul>
          )}
        </PreviewSection>
      ))}
    </article>
  );
}
```

- [ ] **Step 3: Connect preview and export behavior in `App.tsx`**

```tsx
import { ExportActions } from "./components/ExportActions";
import { ResumePreview } from "./components/preview/ResumePreview";

function handleExport() {
  window.print();
}

return (
  <div className="app-shell">
    <header className="topbar">
      <div>
        <h1>简历模块化编辑工具</h1>
        <p>左侧编辑内容，右侧实时预览，支持大板块拖拽和 PDF 导出。</p>
      </div>
      <ExportActions onExport={handleExport} />
    </header>

    <main className="layout">
      <aside className="editor-column">{/* existing editor panels */}</aside>

      <section className="preview-column">
        <div className="preview-header">
          <h2>简历预览</h2>
          <p>拖拽左侧栏目顺序后，这里会立即更新。</p>
        </div>
        <ResumePreview data={resumeData} sectionOrder={sectionOrder} />
      </section>
    </main>
  </div>
);
```

- [ ] **Step 4: Add the full editor and print styles**

```css
.resume-paper {
  width: 794px;
  min-height: 1123px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #dbe2ea;
  border-radius: 8px;
  padding: 32px 40px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
}

.resume-header {
  text-align: center;
  border-bottom: 2px solid #111827;
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.resume-section {
  margin-top: 18px;
}

.resume-section h3 {
  margin: 0 0 10px;
  font-size: 18px;
  border-bottom: 1px solid #6b7280;
  padding-bottom: 8px;
}

.resume-entry {
  margin-top: 12px;
}

.entry-heading {
  display: grid;
  grid-template-columns: 1.8fr 1.2fr 1fr 1fr;
  gap: 8px;
  font-weight: 600;
}

.form-grid,
.stack-list {
  display: grid;
  gap: 12px;
}

label {
  display: grid;
  gap: 6px;
  font-size: 14px;
  color: #374151;
}

input,
textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
}

button {
  font: inherit;
}

.primary-button {
  border: none;
  background: #2563eb;
  color: #fff;
  border-radius: 999px;
  padding: 10px 18px;
  cursor: pointer;
}

.sort-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.sort-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  padding: 12px 14px;
}

.drag-handle {
  border: none;
  background: transparent;
  cursor: grab;
  color: #6b7280;
}

@media print {
  body {
    min-width: auto;
    background: #fff;
  }

  .topbar,
  .editor-column,
  .preview-header {
    display: none !important;
  }

  .layout {
    display: block;
  }

  .resume-paper {
    width: auto;
    min-height: auto;
    box-shadow: none;
    border: none;
    padding: 0;
    margin: 0;
  }
}
```

- [ ] **Step 5: Run the app tests and a production build**

Run: `npm test`

Expected: PASS for helper tests and app interaction tests.

Run: `npm run build`

Expected: PASS with Vite build output under `dist/`.

### Task 5: Fill In The Remaining Forms And Add Final Interaction Coverage

**Files:**
- Modify: `src/components/forms/ProjectExperienceForm.tsx`
- Modify: `src/components/forms/WorkExperienceForm.tsx`
- Modify: `src/components/forms/EducationForm.tsx`
- Modify: `src/components/forms/SkillsForm.tsx`
- Modify: `src/components/forms/OtherInfoForm.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add a full preview-oriented test for repeatable sections**

```tsx
it("adds a project entry and shows it in the preview", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: "新增项目经历" }));
  const nameInputs = screen.getAllByLabelText("项目名称");
  await user.type(nameInputs[nameInputs.length - 1], "智慧园区管理平台");

  expect(screen.getByText("智慧园区管理平台")).toBeInTheDocument();
});
```

- [ ] **Step 2: Finish the repeatable form implementations**

For `ProjectExperienceForm.tsx`, use this item editor shape:

```tsx
<article className="repeat-card">
  <div className="repeat-card-header">
    <h3>项目经历 {index + 1}</h3>
    <div className="inline-actions">
      <button type="button" onClick={() => moveUp(index)}>上移</button>
      <button type="button" onClick={() => moveDown(index)}>下移</button>
      <button type="button" onClick={() => remove(index)}>删除</button>
    </div>
  </div>
  <label>
    项目名称
    <input value={item.projectName} onChange={...} />
  </label>
  <label>
    项目角色
    <input value={item.projectRole} onChange={...} />
  </label>
  <label>
    项目时间
    <input value={item.projectTime} onChange={...} />
  </label>
  <label>
    项目简介
    <textarea value={item.projectSummary} onChange={...} rows={3} />
  </label>
</article>
```

Apply the same repeat-card pattern to work and education:

- work uses labels `公司名称`, `岗位名称`, `工作地点`, `任职时间`
- education uses labels `学校名称`, `专业`, `学历`, `在校时间`
- skills uses grouped list editors for `语言`, `技能`, `爱好`
- other info uses a simple list editor with label `其他信息`

At the bottom of each repeatable form, add buttons:

```tsx
<button type="button" onClick={handleAdd}>
  新增项目经历
</button>
```

```tsx
<button type="button" onClick={handleAdd}>
  新增工作经历
</button>
```

```tsx
<button type="button" onClick={handleAdd}>
  新增教育经历
</button>
```

- [ ] **Step 3: Mount all forms in the main page**

```tsx
<SectionCard title="项目经历">
  <ProjectExperienceForm
    items={resumeData.projects}
    onChange={(projects) => setResumeData((current) => ({ ...current, projects }))}
  />
</SectionCard>

<SectionCard title="工作经历">
  <WorkExperienceForm
    items={resumeData.workExperiences}
    onChange={(workExperiences) =>
      setResumeData((current) => ({ ...current, workExperiences }))
    }
  />
</SectionCard>

<SectionCard title="教育经历">
  <EducationForm
    items={resumeData.educations}
    onChange={(educations) => setResumeData((current) => ({ ...current, educations }))}
  />
</SectionCard>

<SectionCard title="相关技能">
  <SkillsForm
    value={resumeData.skills}
    onChange={(skills) => setResumeData((current) => ({ ...current, skills }))}
  />
</SectionCard>

<SectionCard title="其他信息">
  <OtherInfoForm
    items={resumeData.others}
    onChange={(others) => setResumeData((current) => ({ ...current, others }))}
  />
</SectionCard>
```

- [ ] **Step 4: Run the complete verification pass**

Run: `npm test`

Expected: PASS with shell, sync, export, and repeatable-section tests.

Run: `npm run build`

Expected: PASS with a production bundle ready to preview.

Run: `npm run dev`

Expected: local Vite server starts and prints a `http://localhost:` URL for manual review.

## Self-Review

- Spec coverage: this plan covers local single-page setup, structured forms, top-level drag sorting, live preview, empty section hiding, and browser PDF export.
- Placeholder scan: removed `TODO` language and named the exact files, commands, and component entry points.
- Type consistency: `ResumeData`, `SectionKey`, `defaultResumeData`, `defaultSectionOrder`, `visibleSections`, and `ResumePreview` use the same names across all tasks.
