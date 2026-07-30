import type {
  LayoutBlockState,
  ResumeData,
  SectionKey,
  SectionTitleKey,
  SectionTitles
} from "../types/resume";

export const LAYOUT_STORAGE_KEY = "resume-layout-state";
export const SECTION_TITLES_STORAGE_KEY = "resume-section-titles";
export const SECTION_LAYOUT_STORAGE_KEY = "resume-section-layout";
export const GRID_SIZE = 8;
export const SNAP_THRESHOLD = 8;
export const MAGNETIC_SNAP_THRESHOLD = 12;

export type SnapAxis = {
  start: number;
  center: number;
  end: number;
};

export type SnapBounds = {
  x: SnapAxis;
  y: SnapAxis;
};

export type MagneticSnapInput = {
  x: number;
  y: number;
  width: number;
  height: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  originLeft: number;
  originTop: number;
  snapTargets: SnapBounds[];
  threshold?: number;
};

export function createItemId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isNonEmptyText(value: string): boolean {
  return value.trim().length > 0;
}

export function moveArrayItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return [...items];
  }

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

export function removeArrayItem<T>(items: T[], index: number): T[] {
  return items.filter((_, currentIndex) => currentIndex !== index);
}

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function getSnapAdjustment(
  currentLines: SnapAxis,
  targets: SnapBounds[],
  axis: "x" | "y",
  threshold: number
): number {
  const currentValues = [currentLines.start, currentLines.center, currentLines.end];
  let bestDistance = threshold + 1;
  let bestAdjustment = 0;

  for (const target of targets) {
    const targetValues = [target[axis].start, target[axis].center, target[axis].end];

    for (const current of currentValues) {
      for (const targetValue of targetValues) {
        const adjustment = targetValue - current;
        const distance = Math.abs(adjustment);

        if (distance <= threshold && distance < bestDistance) {
          bestDistance = distance;
          bestAdjustment = adjustment;
        }
      }
    }
  }

  return bestAdjustment;
}

export function applyMagneticSnap({
  x,
  y,
  width,
  height,
  minX,
  maxX,
  minY,
  maxY,
  originLeft,
  originTop,
  snapTargets,
  threshold = MAGNETIC_SNAP_THRESHOLD
}: MagneticSnapInput): LayoutBlockState {
  const currentX = {
    start: originLeft + x,
    center: originLeft + x + width / 2,
    end: originLeft + x + width
  };
  const currentY = {
    start: originTop + y,
    center: originTop + y + height / 2,
    end: originTop + y + height
  };

  const adjustedX = x + getSnapAdjustment(currentX, snapTargets, "x", threshold);
  const adjustedY = y + getSnapAdjustment(currentY, snapTargets, "y", threshold);

  return {
    x: clampValue(adjustedX, minX, maxX),
    y: clampValue(adjustedY, minY, maxY)
  };
}

function valueHasContent(value: unknown): boolean {
  if (typeof value === "string") return isNonEmptyText(value);
  if (Array.isArray(value)) {
    return value.some((item) => (typeof item === "string" ? isNonEmptyText(item) : valueHasContent(item)));
  }
  if (value && typeof value === "object") {
    return Object.values(value).some(valueHasContent);
  }
  return false;
}

export function hasVisibleContent(data: ResumeData, key: SectionKey): boolean {
  if (key === "coreStrengths") return data.coreStrengths.some(isNonEmptyText);
  if (key === "projects") return data.projects.some(valueHasContent);
  if (key === "workExperiences") return data.workExperiences.some(valueHasContent);
  if (key === "educations") return data.educations.some(valueHasContent);
  if (key === "skills") return valueHasContent(data.skills);
  return data.others.some(isNonEmptyText);
}

export function visibleSections(data: ResumeData, order: SectionKey[]): SectionKey[] {
  return order.filter((key) => hasVisibleContent(data, key));
}

export function normalizeSectionTitle(
  key: SectionTitleKey,
  value: string,
  defaults: SectionTitles
): string {
  return value.trim() || defaults[key];
}
