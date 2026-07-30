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

export type SectionTitleKey = SectionKey | "basicInfo";

export type SectionTitles = Record<SectionTitleKey, string>;

export type SectionLayout = Record<SectionKey, LayoutBlockState>;
