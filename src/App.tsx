import { useEffect, useMemo, useRef, useState } from "react";
import {
  createEmptyEducation,
  createEmptyProject,
  createEmptyWork,
  defaultResumeData,
  defaultSectionOrder,
  defaultSectionTitles,
  sectionLabels
} from "./data/defaultResume";
import type {
  BasicInfo,
  EducationItem,
  LayoutBlockState,
  LayoutState,
  ProjectItem,
  ResumeData,
  SectionKey,
  SectionLayout,
  SectionTitleKey,
  SectionTitles,
  Skills,
  WorkItem
} from "./types/resume";
import {
  GRID_SIZE,
  LAYOUT_STORAGE_KEY,
  SECTION_LAYOUT_STORAGE_KEY,
  SECTION_TITLES_STORAGE_KEY,
  SNAP_THRESHOLD,
  applyMagneticSnap,
  clampValue,
  isNonEmptyText,
  moveArrayItem,
  normalizeSectionTitle,
  removeArrayItem,
  snapToGrid,
  updateArrayItem,
  visibleSections
} from "./utils/resume";
import type { SnapBounds } from "./utils/resume";

type SectionCardProps = {
  sectionKey?: SectionTitleKey;
  title: string;
  titleValue?: string;
  onTitleChange?: (value: string) => void;
  onTitleBlur?: (value: string) => void;
  children: React.ReactNode;
};

type SorterProps = {
  order: SectionKey[];
  onChange: (next: SectionKey[]) => void;
};

type StringListEditorProps = {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel?: string;
  placeholder?: string;
};

type BasicInfoFormProps = {
  value: BasicInfo;
  onChange: (next: BasicInfo) => void;
};

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

type SkillsFormProps = {
  value: Skills;
  onChange: (next: Skills) => void;
};

type OtherInfoFormProps = {
  items: string[];
  onChange: (items: string[]) => void;
};

type ResumePreviewProps = {
  data: ResumeData;
  sectionOrder: SectionKey[];
  sectionTitles: SectionTitles;
  layoutState: LayoutState;
  sectionLayout: SectionLayout;
  activeGuide: GuideState;
  onBlockMove: (blockId: string, position: LayoutBlockState) => void;
  onSectionMove: (sectionKey: SectionKey, position: LayoutBlockState) => void;
  onGuideChange: (guide: GuideState) => void;
};

type GuideState = {
  x: number;
  y: number;
} | null;

type DraggableLabelProps = {
  blockId: string;
  className: string;
  children: React.ReactNode;
  enabled: boolean;
  layoutState: LayoutState;
  onMove: (blockId: string, position: LayoutBlockState) => void;
  onGuideChange: (guide: GuideState) => void;
};

type DraggableSectionProps = {
  sectionKey: SectionKey;
  title: string;
  enabled: boolean;
  offset: LayoutBlockState;
  onMove: (sectionKey: SectionKey, position: LayoutBlockState) => void;
  onGuideChange: (guide: GuideState) => void;
  children: React.ReactNode;
};

const DEFAULT_LAYOUT_STATE: LayoutState = {
  layoutMode: false,
  showGrid: false,
  blocks: {}
};

const DEFAULT_SECTION_LAYOUT: SectionLayout = {
  coreStrengths: { x: 0, y: 0 },
  projects: { x: 0, y: 0 },
  workExperiences: { x: 0, y: 0 },
  educations: { x: 0, y: 0 },
  skills: { x: 0, y: 0 },
  others: { x: 0, y: 0 }
};

function getBlockOffset(layoutState: LayoutState, blockId: string): LayoutBlockState {
  return layoutState.blocks[blockId] ?? { x: 0, y: 0 };
}

function loadLayoutState(): LayoutState {
  if (typeof window === "undefined") return DEFAULT_LAYOUT_STATE;

  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT_STATE;

    const parsed = JSON.parse(raw) as Partial<LayoutState>;
    return {
      layoutMode: false,
      showGrid: Boolean(parsed.showGrid),
      blocks: parsed.blocks ?? {}
    };
  } catch {
    return DEFAULT_LAYOUT_STATE;
  }
}

function loadSectionTitles(): SectionTitles {
  if (typeof window === "undefined") return defaultSectionTitles;

  try {
    const raw = window.localStorage.getItem(SECTION_TITLES_STORAGE_KEY);
    if (!raw) return defaultSectionTitles;

    const parsed = JSON.parse(raw) as Partial<SectionTitles>;
    return {
      ...defaultSectionTitles,
      ...parsed
    };
  } catch {
    return defaultSectionTitles;
  }
}

function loadSectionLayout(): SectionLayout {
  if (typeof window === "undefined") return DEFAULT_SECTION_LAYOUT;

  try {
    const raw = window.localStorage.getItem(SECTION_LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_SECTION_LAYOUT;

    const parsed = JSON.parse(raw) as Partial<SectionLayout>;
    return {
      ...DEFAULT_SECTION_LAYOUT,
      ...parsed
    };
  } catch {
    return DEFAULT_SECTION_LAYOUT;
  }
}

function getValidLayoutBlockIds(data: ResumeData): Set<string> {
  return new Set([
    ...data.projects.map((item) => `project-role-${item.id}`),
    ...data.workExperiences.map((item) => `work-title-${item.id}`),
    ...data.educations.map((item) => `education-major-${item.id}`)
  ]);
}

function getSnapBounds(node: Element, paperRect: DOMRect): SnapBounds {
  const rect = node.getBoundingClientRect();

  return {
    x: {
      start: rect.left - paperRect.left,
      center: rect.left - paperRect.left + rect.width / 2,
      end: rect.right - paperRect.left
    },
    y: {
      start: rect.top - paperRect.top,
      center: rect.top - paperRect.top + rect.height / 2,
      end: rect.bottom - paperRect.top
    }
  };
}

function DraggableLabel({
  blockId,
  className,
  children,
  enabled,
  layoutState,
  onMove,
  onGuideChange
}: DraggableLabelProps) {
  const labelRef = useRef<HTMLDivElement | null>(null);
  const offset = getBlockOffset(layoutState, blockId);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!enabled || !labelRef.current) return;

    const labelNode = labelRef.current;
    const paperNode = labelNode.closest(".resume-paper");
    if (!(paperNode instanceof HTMLElement)) return;

    event.preventDefault();

    const labelRect = labelNode.getBoundingClientRect();
    const paperRect = paperNode.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startOffset = offset;
    const baseLeft = labelRect.left - startOffset.x;
    const baseTop = labelRect.top - startOffset.y;
    const padding = GRID_SIZE;
    const minX = paperRect.left + padding - baseLeft;
    const maxX = paperRect.right - labelRect.width - padding - baseLeft;
    const minY = paperRect.top + padding - baseTop;
    const maxY = paperRect.bottom - labelRect.height - padding - baseTop;

    const updateGuide = (nextX: number, nextY: number) => {
      const x = baseLeft - paperRect.left + nextX + labelRect.width / 2;
      const y = baseTop - paperRect.top + nextY + labelRect.height / 2;
      onGuideChange({ x, y });
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      let nextX = clampValue(startOffset.x + deltaX, minX, maxX);
      let nextY = clampValue(startOffset.y + deltaY, minY, maxY);

      const unsnappedCenterX = baseLeft - paperRect.left + nextX + labelRect.width / 2;
      const paperCenterX = paperRect.width / 2;
      if (Math.abs(unsnappedCenterX - paperCenterX) <= SNAP_THRESHOLD) {
        nextX += paperCenterX - unsnappedCenterX;
      }

      nextX = clampValue(snapToGrid(nextX), minX, maxX);
      nextY = clampValue(snapToGrid(nextY), minY, maxY);

      onMove(blockId, { x: nextX, y: nextY });
      updateGuide(nextX, nextY);
    };

    const handlePointerUp = () => {
      onGuideChange(null);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    updateGuide(startOffset.x, startOffset.y);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <div
      ref={labelRef}
      data-testid={`draggable-${blockId}`}
      className={`${className} draggable-label${enabled ? " is-layout-enabled" : ""}`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      onPointerDown={handlePointerDown}
    >
      {children}
    </div>
  );
}

function DraggableSection({
  sectionKey,
  title,
  enabled,
  offset,
  onMove,
  onGuideChange,
  children
}: DraggableSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (!enabled || !sectionRef.current) return;

    const target = event.target as HTMLElement;
    if (target.closest(".draggable-label")) return;

    const sectionNode = sectionRef.current;
    const paperNode = sectionNode.closest(".resume-paper");
    if (!(paperNode instanceof HTMLElement)) return;

    event.preventDefault();

    const sectionRect = sectionNode.getBoundingClientRect();
    const paperRect = paperNode.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startOffset = offset;
    const baseLeft = sectionRect.left - startOffset.x;
    const baseTop = sectionRect.top - startOffset.y;
    const baseLeftInPaper = baseLeft - paperRect.left;
    const baseTopInPaper = baseTop - paperRect.top;
    const padding = GRID_SIZE;
    const minX = paperRect.left + padding - baseLeft;
    const maxX = paperRect.right - sectionRect.width - padding - baseLeft;
    const minY = paperRect.top + padding - baseTop;
    const maxY = paperRect.bottom - sectionRect.height - padding - baseTop;
    const snapTargets: SnapBounds[] = [
      {
        x: {
          start: padding,
          center: paperRect.width / 2,
          end: paperRect.width - padding
        },
        y: {
          start: padding,
          center: paperRect.height / 2,
          end: paperRect.height - padding
        }
      },
      ...Array.from(paperNode.querySelectorAll(".draggable-section"))
        .filter((node) => node !== sectionNode)
        .map((node) => getSnapBounds(node, paperRect))
    ];

    const updateGuide = (nextX: number, nextY: number) => {
      const x = baseLeft - paperRect.left + nextX + sectionRect.width / 2;
      const y = baseTop - paperRect.top + nextY + sectionRect.height / 2;
      onGuideChange({ x, y });
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      let nextX = clampValue(startOffset.x + deltaX, minX, maxX);
      let nextY = clampValue(startOffset.y + deltaY, minY, maxY);

      const unsnappedCenterX = baseLeft - paperRect.left + nextX + sectionRect.width / 2;
      const paperCenterX = paperRect.width / 2;
      if (Math.abs(unsnappedCenterX - paperCenterX) <= SNAP_THRESHOLD) {
        nextX += paperCenterX - unsnappedCenterX;
      }

      nextX = clampValue(snapToGrid(nextX), minX, maxX);
      nextY = clampValue(snapToGrid(nextY), minY, maxY);
      ({ x: nextX, y: nextY } = applyMagneticSnap({
        x: nextX,
        y: nextY,
        width: sectionRect.width,
        height: sectionRect.height,
        minX,
        maxX,
        minY,
        maxY,
        originLeft: baseLeftInPaper,
        originTop: baseTopInPaper,
        snapTargets
      }));

      onMove(sectionKey, { x: nextX, y: nextY });
      updateGuide(nextX, nextY);
    };

    const handlePointerUp = () => {
      onGuideChange(null);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    updateGuide(startOffset.x, startOffset.y);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <section
      ref={sectionRef}
      data-testid={`section-${sectionKey}`}
      className={`resume-section draggable-section${enabled ? " is-layout-enabled" : ""}`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      onPointerDown={handlePointerDown}
    >
      <h3>{title}</h3>
      <div className="resume-section-body">{children}</div>
    </section>
  );
}

function RulerOverlay() {
  const marks = Array.from({ length: 11 }, (_, index) => index * 80);

  return (
    <>
      <div className="ruler ruler-horizontal" data-testid="horizontal-ruler" aria-hidden="true">
        {marks.map((mark) => (
          <span key={`x-${mark}`} className="ruler-mark" style={{ left: `${mark}px` }}>
            {mark}
          </span>
        ))}
      </div>
      <div className="ruler ruler-vertical" data-testid="vertical-ruler" aria-hidden="true">
        {marks.map((mark) => (
          <span key={`y-${mark}`} className="ruler-mark" style={{ top: `${mark}px` }}>
            {mark}
          </span>
        ))}
      </div>
    </>
  );
}

function SectionCard({
  sectionKey,
  title,
  titleValue,
  onTitleChange,
  onTitleBlur,
  children
}: SectionCardProps) {
  return (
    <section className="panel section-card">
      <h2>{titleValue ?? title}</h2>
      <div className="section-card-body">{children}</div>
      {sectionKey && titleValue !== undefined && onTitleChange && (
        <label className="field section-title-field">
          <span>模块标题</span>
          <input
            aria-label={`${title}模块标题`}
            value={titleValue}
            onChange={(event) => onTitleChange(event.target.value)}
            onBlur={(event) => onTitleBlur?.(event.target.value)}
          />
        </label>
      )}
    </section>
  );
}

function SectionSorter({ order, onChange }: SorterProps) {
  const [draggingKey, setDraggingKey] = useState<SectionKey | null>(null);

  function handleDrop(targetKey: SectionKey) {
    if (!draggingKey || draggingKey === targetKey) return;

    const from = order.indexOf(draggingKey);
    const to = order.indexOf(targetKey);
    onChange(moveArrayItem(order, from, to));
    setDraggingKey(null);
  }

  return (
    <ul className="sort-list">
      {order.map((key) => (
        <li
          key={key}
          className={`sort-item${draggingKey === key ? " dragging" : ""}`}
          draggable
          onDragStart={(event) => {
            setDraggingKey(key);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", key);
          }}
          onDragEnd={() => setDraggingKey(null)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => handleDrop(key)}
        >
          <span className="drag-handle" aria-hidden="true">
            ::
          </span>
          <span className="sort-label">{sectionLabels[key]}</span>
        </li>
      ))}
    </ul>
  );
}

function StringListEditor({
  title,
  items,
  onChange,
  addLabel = "新增一条",
  placeholder
}: StringListEditorProps) {
  const getLabel = (index: number) => (items.length > 1 ? `${title} ${index + 1}` : title);

  return (
    <div className="stack-list">
      {items.map((item, index) => (
        <div className="list-row" key={`${title}-${index}`}>
          <label className="field">
            <span>{getLabel(index)}</span>
            <input
              aria-label={getLabel(index)}
              value={item}
              placeholder={placeholder}
              onChange={(event) =>
                onChange(
                  items.map((current, currentIndex) =>
                    currentIndex === index ? event.target.value : current
                  )
                )
              }
            />
          </label>
          <div className="row-actions">
            <button
              type="button"
              onClick={() => onChange(moveArrayItem(items, index, index - 1))}
              disabled={index === 0}
            >
              上移
            </button>
            <button
              type="button"
              onClick={() => onChange(moveArrayItem(items, index, index + 1))}
              disabled={index === items.length - 1}
            >
              下移
            </button>
            <button
              type="button"
              onClick={() => onChange(removeArrayItem(items, index))}
              disabled={items.length === 1}
            >
              删除
            </button>
          </div>
        </div>
      ))}

      <button type="button" className="secondary-button" onClick={() => onChange([...items, ""])}>
        {addLabel}
      </button>
    </div>
  );
}

function BasicInfoForm({ value, onChange }: BasicInfoFormProps) {
  return (
    <div className="form-grid">
      <label className="field">
        <span>姓名</span>
        <input
          aria-label="姓名"
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
        />
      </label>
      <label className="field">
        <span>电话</span>
        <input
          aria-label="电话"
          value={value.phone}
          onChange={(event) => onChange({ ...value, phone: event.target.value })}
        />
      </label>
      <label className="field">
        <span>邮箱</span>
        <input
          aria-label="邮箱"
          value={value.email}
          onChange={(event) => onChange({ ...value, email: event.target.value })}
        />
      </label>
      <label className="field">
        <span>微信</span>
        <input
          aria-label="微信"
          value={value.wechat}
          onChange={(event) => onChange({ ...value, wechat: event.target.value })}
        />
      </label>
    </div>
  );
}

function CoreStrengthsForm({
  items,
  onChange
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <StringListEditor
      title="优势要点"
      items={items}
      onChange={onChange}
      addLabel="新增优势要点"
      placeholder="例如：跨部门协调与会务组织"
    />
  );
}

function ProjectExperienceForm({ items, onChange }: ProjectExperienceFormProps) {
  function patchItem(index: number, patch: Partial<ProjectItem>) {
    onChange(updateArrayItem(items, index, patch));
  }

  return (
    <div className="repeat-list">
      {items.map((item, index) => (
        <article className="repeat-card" key={item.id}>
          <div className="repeat-card-header">
            <h3>项目经历 {index + 1}</h3>
            <div className="inline-actions">
              <button
                type="button"
                onClick={() => onChange(moveArrayItem(items, index, index - 1))}
                disabled={index === 0}
              >
                上移
              </button>
              <button
                type="button"
                onClick={() => onChange(moveArrayItem(items, index, index + 1))}
                disabled={index === items.length - 1}
              >
                下移
              </button>
              <button
                type="button"
                onClick={() => onChange(removeArrayItem(items, index))}
                disabled={items.length === 1}
              >
                删除
              </button>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>项目名称</span>
              <input
                aria-label="项目名称"
                value={item.projectName}
                onChange={(event) => patchItem(index, { projectName: event.target.value })}
              />
            </label>
            <label className="field">
              <span>项目角色</span>
              <input
                aria-label="项目角色"
                value={item.projectRole}
                onChange={(event) => patchItem(index, { projectRole: event.target.value })}
              />
            </label>
            <label className="field">
              <span>项目时间</span>
              <input
                aria-label="项目时间"
                value={item.projectTime}
                onChange={(event) => patchItem(index, { projectTime: event.target.value })}
              />
            </label>
            <label className="field">
              <span>使用工具</span>
              <input
                aria-label="使用工具"
                value={item.tools}
                onChange={(event) => patchItem(index, { tools: event.target.value })}
              />
            </label>
          </div>

          <label className="field">
            <span>项目简介</span>
            <textarea
              aria-label="项目简介"
              rows={3}
              value={item.projectSummary}
              onChange={(event) => patchItem(index, { projectSummary: event.target.value })}
            />
          </label>

          <StringListEditor
            title="项目成果"
            items={item.projectHighlights}
            onChange={(projectHighlights) => patchItem(index, { projectHighlights })}
            addLabel="新增成果要点"
          />
        </article>
      ))}

      <button
        type="button"
        className="secondary-button"
        onClick={() => onChange([...items, createEmptyProject()])}
      >
        新增项目经历
      </button>
    </div>
  );
}

function WorkExperienceForm({ items, onChange }: WorkExperienceFormProps) {
  function patchItem(index: number, patch: Partial<WorkItem>) {
    onChange(updateArrayItem(items, index, patch));
  }

  return (
    <div className="repeat-list">
      {items.map((item, index) => (
        <article className="repeat-card" key={item.id}>
          <div className="repeat-card-header">
            <h3>工作经历 {index + 1}</h3>
            <div className="inline-actions">
              <button
                type="button"
                onClick={() => onChange(moveArrayItem(items, index, index - 1))}
                disabled={index === 0}
              >
                上移
              </button>
              <button
                type="button"
                onClick={() => onChange(moveArrayItem(items, index, index + 1))}
                disabled={index === items.length - 1}
              >
                下移
              </button>
              <button
                type="button"
                onClick={() => onChange(removeArrayItem(items, index))}
                disabled={items.length === 1}
              >
                删除
              </button>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>公司名称</span>
              <input
                aria-label="公司名称"
                value={item.companyName}
                onChange={(event) => patchItem(index, { companyName: event.target.value })}
              />
            </label>
            <label className="field">
              <span>岗位名称</span>
              <input
                aria-label="岗位名称"
                value={item.jobTitle}
                onChange={(event) => patchItem(index, { jobTitle: event.target.value })}
              />
            </label>
            <label className="field">
              <span>工作地点</span>
              <input
                aria-label="工作地点"
                value={item.location}
                onChange={(event) => patchItem(index, { location: event.target.value })}
              />
            </label>
            <label className="field">
              <span>任职时间</span>
              <input
                aria-label="任职时间"
                value={item.workTime}
                onChange={(event) => patchItem(index, { workTime: event.target.value })}
              />
            </label>
          </div>

          <StringListEditor
            title="工作内容"
            items={item.responsibilities}
            onChange={(responsibilities) => patchItem(index, { responsibilities })}
            addLabel="新增工作要点"
          />
        </article>
      ))}

      <button
        type="button"
        className="secondary-button"
        onClick={() => onChange([...items, createEmptyWork()])}
      >
        新增工作经历
      </button>
    </div>
  );
}

function EducationForm({ items, onChange }: EducationFormProps) {
  function patchItem(index: number, patch: Partial<EducationItem>) {
    onChange(updateArrayItem(items, index, patch));
  }

  return (
    <div className="repeat-list">
      {items.map((item, index) => (
        <article className="repeat-card" key={item.id}>
          <div className="repeat-card-header">
            <h3>教育经历 {index + 1}</h3>
            <div className="inline-actions">
              <button
                type="button"
                onClick={() => onChange(moveArrayItem(items, index, index - 1))}
                disabled={index === 0}
              >
                上移
              </button>
              <button
                type="button"
                onClick={() => onChange(moveArrayItem(items, index, index + 1))}
                disabled={index === items.length - 1}
              >
                下移
              </button>
              <button
                type="button"
                onClick={() => onChange(removeArrayItem(items, index))}
                disabled={items.length === 1}
              >
                删除
              </button>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>学校名称</span>
              <input
                aria-label="学校名称"
                value={item.schoolName}
                onChange={(event) => patchItem(index, { schoolName: event.target.value })}
              />
            </label>
            <label className="field">
              <span>专业</span>
              <input
                aria-label="专业"
                value={item.major}
                onChange={(event) => patchItem(index, { major: event.target.value })}
              />
            </label>
            <label className="field">
              <span>学历</span>
              <input
                aria-label="学历"
                value={item.degree}
                onChange={(event) => patchItem(index, { degree: event.target.value })}
              />
            </label>
            <label className="field">
              <span>在校时间</span>
              <input
                aria-label="在校时间"
                value={item.educationTime}
                onChange={(event) => patchItem(index, { educationTime: event.target.value })}
              />
            </label>
          </div>

          <StringListEditor
            title="补充说明"
            items={item.notes}
            onChange={(notes) => patchItem(index, { notes })}
            addLabel="新增补充说明"
          />
        </article>
      ))}

      <button
        type="button"
        className="secondary-button"
        onClick={() => onChange([...items, createEmptyEducation()])}
      >
        新增教育经历
      </button>
    </div>
  );
}

function SkillsForm({ value, onChange }: SkillsFormProps) {
  return (
    <div className="repeat-list">
      <StringListEditor
        title="语言"
        items={value.languages}
        onChange={(languages) => onChange({ ...value, languages })}
        addLabel="新增语言"
      />
      <StringListEditor
        title="技能"
        items={value.tools}
        onChange={(tools) => onChange({ ...value, tools })}
        addLabel="新增技能"
      />
      <StringListEditor
        title="爱好"
        items={value.interests}
        onChange={(interests) => onChange({ ...value, interests })}
        addLabel="新增爱好"
      />
    </div>
  );
}

function OtherInfoForm({ items, onChange }: OtherInfoFormProps) {
  return (
    <StringListEditor title="其他信息" items={items} onChange={onChange} addLabel="新增一条" />
  );
}

function ResumePreview({
  data,
  sectionOrder,
  sectionTitles,
  layoutState,
  sectionLayout,
  activeGuide,
  onBlockMove,
  onSectionMove,
  onGuideChange
}: ResumePreviewProps) {
  const sections = visibleSections(data, sectionOrder);
  const contactLine = [
    data.basicInfo.phone ? `电话: ${data.basicInfo.phone}` : "",
    data.basicInfo.email ? `邮箱: ${data.basicInfo.email}` : "",
    data.basicInfo.wechat ? `微信: ${data.basicInfo.wechat}` : ""
  ]
    .filter(isNonEmptyText)
    .join(" | ");

  const sectionContent = useMemo(
    () => ({
      coreStrengths: <p>{data.coreStrengths.filter(isNonEmptyText).join(" | ")}</p>,
      projects: data.projects
        .filter(
          (item) =>
            [
              item.projectName,
              item.projectRole,
              item.projectTime,
              item.projectSummary,
              item.tools,
              ...item.projectHighlights
            ].some(isNonEmptyText)
        )
        .map((item) => (
          <div className="resume-entry" key={item.id}>
            <div className="entry-heading entry-heading-project">
              <div className="entry-left">
                <strong>{item.projectName || "未命名项目"}</strong>
              </div>
              <DraggableLabel
                blockId={`project-role-${item.id}`}
                className="entry-center"
                enabled={layoutState.layoutMode}
                layoutState={layoutState}
                onMove={onBlockMove}
                onGuideChange={onGuideChange}
              >
                {item.projectRole}
              </DraggableLabel>
              <div className="entry-right">
                <span className="entry-time">{item.projectTime}</span>
              </div>
            </div>
            {item.projectSummary && <p className="entry-summary">{item.projectSummary}</p>}
            {item.tools && <p className="entry-meta">工具: {item.tools}</p>}
            <ul>
              {item.projectHighlights.filter(isNonEmptyText).map((line, index) => (
                <li key={`${item.id}-${index}`}>{line}</li>
              ))}
            </ul>
          </div>
        )),
      workExperiences: data.workExperiences
        .filter(
          (item) =>
            [item.companyName, item.jobTitle, item.location, item.workTime, ...item.responsibilities].some(
              isNonEmptyText
            )
        )
        .map((item) => (
          <div className="resume-entry" key={item.id}>
            <div className="entry-heading entry-heading-work">
              <div className="entry-left">
                <strong>{item.companyName || "未填写公司"}</strong>
              </div>
              <DraggableLabel
                blockId={`work-title-${item.id}`}
                className="entry-center"
                enabled={layoutState.layoutMode}
                layoutState={layoutState}
                onMove={onBlockMove}
                onGuideChange={onGuideChange}
              >
                {item.jobTitle}
              </DraggableLabel>
              <div className="entry-right">
                <span className="entry-time">{item.workTime}</span>
                {item.location && <span>{item.location}</span>}
              </div>
            </div>
            <ul>
              {item.responsibilities.filter(isNonEmptyText).map((line, index) => (
                <li key={`${item.id}-${index}`}>{line}</li>
              ))}
            </ul>
          </div>
        )),
      educations: data.educations
        .filter(
          (item) =>
            [item.schoolName, item.major, item.degree, item.educationTime, ...item.notes].some(isNonEmptyText)
        )
        .map((item) => (
          <div className="resume-entry" key={item.id}>
            <div className="entry-heading entry-heading-education">
              <div className="entry-left">
                <strong>{item.schoolName || "未填写学校"}</strong>
              </div>
              <DraggableLabel
                blockId={`education-major-${item.id}`}
                className="entry-center"
                enabled={layoutState.layoutMode}
                layoutState={layoutState}
                onMove={onBlockMove}
                onGuideChange={onGuideChange}
              >
                {item.major}
              </DraggableLabel>
              <div className="entry-right">
                <span className="entry-time">{item.educationTime}</span>
                {item.degree && <span>{item.degree}</span>}
              </div>
            </div>
            <ul>
              {item.notes.filter(isNonEmptyText).map((line, index) => (
                <li key={`${item.id}-${index}`}>{line}</li>
              ))}
            </ul>
          </div>
        )),
      skills: (
        <div className="skills-block">
          {data.skills.languages.some(isNonEmptyText) && (
            <p>语言: {data.skills.languages.filter(isNonEmptyText).join("，")}</p>
          )}
          {data.skills.tools.some(isNonEmptyText) && (
            <p>技能: {data.skills.tools.filter(isNonEmptyText).join("，")}</p>
          )}
          {data.skills.interests.some(isNonEmptyText) && (
            <p>爱好: {data.skills.interests.filter(isNonEmptyText).join("，")}</p>
          )}
        </div>
      ),
      others: (
        <ul>
          {data.others.filter(isNonEmptyText).map((line, index) => (
            <li key={`other-${index}`}>{line}</li>
          ))}
        </ul>
      )
    }),
    [data]
  );

  return (
    <div className={`preview-canvas${layoutState.layoutMode ? " is-layout-mode" : ""}`}>
      {layoutState.layoutMode && <RulerOverlay />}
      {layoutState.layoutMode && <div className="preview-center-line" aria-hidden="true" />}
      {layoutState.layoutMode && layoutState.showGrid && (
        <div className="preview-grid" data-testid="preview-grid" aria-hidden="true" />
      )}
      {layoutState.layoutMode && activeGuide && (
        <div className="guide-overlay" aria-hidden="true">
          <div className="guide-line guide-line-x" style={{ top: `${activeGuide.y}px` }} />
          <div className="guide-line guide-line-y" style={{ left: `${activeGuide.x}px` }} />
        </div>
      )}

      <article className="resume-paper" aria-label="resume-preview">
        <header className="resume-header">
          <h1>{data.basicInfo.name || "未填写姓名"}</h1>
          {contactLine && <p>{contactLine}</p>}
        </header>

        {sections.map((key) => (
          <DraggableSection
            key={key}
            sectionKey={key}
            title={sectionTitles[key]}
            enabled={layoutState.layoutMode}
            offset={sectionLayout[key]}
            onMove={onSectionMove}
            onGuideChange={onGuideChange}
          >
            {sectionContent[key]}
          </DraggableSection>
        ))}
      </article>
    </div>
  );
}

export default function App() {
  const [resumeData, setResumeData] = useState(defaultResumeData);
  const [sectionOrder, setSectionOrder] = useState(defaultSectionOrder);
  const [sectionTitles, setSectionTitles] = useState<SectionTitles>(loadSectionTitles);
  const [sectionLayout, setSectionLayout] = useState<SectionLayout>(loadSectionLayout);
  const [layoutState, setLayoutState] = useState<LayoutState>(loadLayoutState);
  const [activeGuide, setActiveGuide] = useState<GuideState>(null);

  useEffect(() => {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutState));
  }, [layoutState]);

  useEffect(() => {
    window.localStorage.setItem(SECTION_TITLES_STORAGE_KEY, JSON.stringify(sectionTitles));
  }, [sectionTitles]);

  useEffect(() => {
    window.localStorage.setItem(SECTION_LAYOUT_STORAGE_KEY, JSON.stringify(sectionLayout));
  }, [sectionLayout]);

  useEffect(() => {
    const validBlockIds = getValidLayoutBlockIds(resumeData);

    setLayoutState((current) => {
      const blocks = Object.fromEntries(
        Object.entries(current.blocks).filter(([blockId]) => validBlockIds.has(blockId))
      );

      if (Object.keys(blocks).length === Object.keys(current.blocks).length) {
        return current;
      }

      return {
        ...current,
        blocks
      };
    });
  }, [resumeData]);

  function updateBlockPosition(blockId: string, position: LayoutBlockState) {
    setLayoutState((current) => ({
      ...current,
      blocks: {
        ...current.blocks,
        [blockId]: position
      }
    }));
  }

  function updateSectionPosition(sectionKey: SectionKey, position: LayoutBlockState) {
    setSectionLayout((current) => ({
      ...current,
      [sectionKey]: position
    }));
  }

  function handleTitleChange(key: SectionTitleKey, value: string) {
    setSectionTitles((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleTitleBlur(key: SectionTitleKey, value: string) {
    setSectionTitles((current) => ({
      ...current,
      [key]: normalizeSectionTitle(key, value, defaultSectionTitles)
    }));
  }

  function toggleLayoutMode() {
    setLayoutState((current) => ({
      ...current,
      layoutMode: !current.layoutMode
    }));
    setActiveGuide(null);
  }

  function toggleGrid() {
    setLayoutState((current) => ({
      ...current,
      showGrid: !current.showGrid
    }));
  }

  function resetLayout() {
    setLayoutState((current) => ({
      ...current,
      blocks: {}
    }));
    setSectionLayout(DEFAULT_SECTION_LAYOUT);
    setActiveGuide(null);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>简历模块化编辑工具</h1>
          <p>左侧结构化编辑，右侧实时预览，支持大板块拖拽排序和 PDF 导出。</p>
        </div>
        <div className="export-actions">
          <button type="button" className="primary-button" onClick={() => window.print()}>
            导出 PDF
          </button>
          <p>导出时会自动隐藏编辑区，只保留右侧简历版面。</p>
        </div>
      </header>

      <main className="layout">
        <aside className="editor-column">
          <SectionCard title="栏目顺序">
            <p className="helper-text">基本信息固定置顶，其他一级栏目可拖拽排序。</p>
            <SectionSorter order={sectionOrder} onChange={setSectionOrder} />
          </SectionCard>

          <SectionCard
            sectionKey="basicInfo"
            title="基本信息"
            titleValue={sectionTitles.basicInfo}
            onTitleChange={(value) => handleTitleChange("basicInfo", value)}
            onTitleBlur={(value) => handleTitleBlur("basicInfo", value)}
          >
            <BasicInfoForm
              value={resumeData.basicInfo}
              onChange={(basicInfo) => setResumeData((current) => ({ ...current, basicInfo }))}
            />
          </SectionCard>

          <SectionCard
            sectionKey="coreStrengths"
            title="核心优势"
            titleValue={sectionTitles.coreStrengths}
            onTitleChange={(value) => handleTitleChange("coreStrengths", value)}
            onTitleBlur={(value) => handleTitleBlur("coreStrengths", value)}
          >
            <CoreStrengthsForm
              items={resumeData.coreStrengths}
              onChange={(coreStrengths) => setResumeData((current) => ({ ...current, coreStrengths }))}
            />
          </SectionCard>

          <SectionCard
            sectionKey="projects"
            title="项目经历"
            titleValue={sectionTitles.projects}
            onTitleChange={(value) => handleTitleChange("projects", value)}
            onTitleBlur={(value) => handleTitleBlur("projects", value)}
          >
            <ProjectExperienceForm
              items={resumeData.projects}
              onChange={(projects) => setResumeData((current) => ({ ...current, projects }))}
            />
          </SectionCard>

          <SectionCard
            sectionKey="workExperiences"
            title="工作经历"
            titleValue={sectionTitles.workExperiences}
            onTitleChange={(value) => handleTitleChange("workExperiences", value)}
            onTitleBlur={(value) => handleTitleBlur("workExperiences", value)}
          >
            <WorkExperienceForm
              items={resumeData.workExperiences}
              onChange={(workExperiences) =>
                setResumeData((current) => ({ ...current, workExperiences }))
              }
            />
          </SectionCard>

          <SectionCard
            sectionKey="educations"
            title="教育经历"
            titleValue={sectionTitles.educations}
            onTitleChange={(value) => handleTitleChange("educations", value)}
            onTitleBlur={(value) => handleTitleBlur("educations", value)}
          >
            <EducationForm
              items={resumeData.educations}
              onChange={(educations) => setResumeData((current) => ({ ...current, educations }))}
            />
          </SectionCard>

          <SectionCard
            sectionKey="skills"
            title="相关技能"
            titleValue={sectionTitles.skills}
            onTitleChange={(value) => handleTitleChange("skills", value)}
            onTitleBlur={(value) => handleTitleBlur("skills", value)}
          >
            <SkillsForm
              value={resumeData.skills}
              onChange={(skills) => setResumeData((current) => ({ ...current, skills }))}
            />
          </SectionCard>

          <SectionCard
            sectionKey="others"
            title="其他信息"
            titleValue={sectionTitles.others}
            onTitleChange={(value) => handleTitleChange("others", value)}
            onTitleBlur={(value) => handleTitleBlur("others", value)}
          >
            <OtherInfoForm
              items={resumeData.others}
              onChange={(others) => setResumeData((current) => ({ ...current, others }))}
            />
          </SectionCard>
        </aside>

        <section className="preview-column">
          <div className="preview-header">
            <h2>简历预览</h2>
            <p>拖拽左侧栏目顺序后，右侧会立即同步展示顺序。</p>
            <div className="layout-toolbar">
              <button type="button" className="secondary-button" onClick={toggleLayoutMode}>
                {layoutState.layoutMode ? "关闭排版模式" : "开启排版模式"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={toggleGrid}
                disabled={!layoutState.layoutMode}
              >
                {layoutState.showGrid ? "隐藏网格线" : "显示网格线"}
              </button>
              <button type="button" className="secondary-button" onClick={resetLayout}>
                重置排版
              </button>
            </div>
          </div>
          <ResumePreview
            data={resumeData}
            sectionOrder={sectionOrder}
            sectionTitles={sectionTitles}
            layoutState={layoutState}
            sectionLayout={sectionLayout}
            activeGuide={activeGuide}
            onBlockMove={updateBlockPosition}
            onSectionMove={updateSectionPosition}
            onGuideChange={setActiveGuide}
          />
        </section>
      </main>
    </div>
  );
}
