import { describe, expect, it } from "vitest";
import { defaultResumeData, defaultSectionOrder } from "../data/defaultResume";
import {
  applyMagneticSnap,
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
      coreStrengths: [],
      others: []
    };

    expect(hasVisibleContent(emptyData, "others")).toBe(false);
    expect(visibleSections(emptyData, defaultSectionOrder)).not.toContain("others");
    expect(visibleSections(emptyData, defaultSectionOrder)).not.toContain("coreStrengths");
  });

  it("magnetically snaps a moving block to nearby target edges", () => {
    const next = applyMagneticSnap({
      x: 11,
      y: 75,
      width: 120,
      height: 80,
      minX: 0,
      maxX: 400,
      minY: 0,
      maxY: 500,
      originLeft: 0,
      originTop: 0,
      snapTargets: [
        {
          x: { start: 0, center: 200, end: 400 },
          y: { start: 0, center: 160, end: 320 }
        }
      ]
    });

    expect(next.x).toBe(0);
    expect(next.y).toBe(80);
  });

  it("keeps a moving block in place when it is outside the magnetic threshold", () => {
    const next = applyMagneticSnap({
      x: 24,
      y: 40,
      width: 120,
      height: 80,
      minX: 0,
      maxX: 400,
      minY: 0,
      maxY: 500,
      originLeft: 0,
      originTop: 0,
      snapTargets: [
        {
          x: { start: 0, center: 200, end: 400 },
          y: { start: 0, center: 160, end: 320 }
        }
      ]
    });

    expect(next).toEqual({ x: 24, y: 40 });
  });
});
