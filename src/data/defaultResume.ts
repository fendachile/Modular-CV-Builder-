import type {
  EducationItem,
  ProjectItem,
  ResumeData,
  SectionKey,
  SectionTitles,
  WorkItem
} from "../types/resume";
import { createItemId } from "../utils/resume";

export const sectionLabels: Record<SectionKey, string> = {
  coreStrengths: "核心优势",
  projects: "项目经历",
  workExperiences: "工作经历",
  educations: "教育经历",
  skills: "相关技能",
  others: "其他信息"
};

export const defaultSectionOrder: SectionKey[] = [
  "coreStrengths",
  "projects",
  "workExperiences",
  "educations",
  "skills",
  "others"
];

export const defaultSectionTitles: SectionTitles = {
  basicInfo: "基本信息",
  coreStrengths: "核心优势",
  projects: "项目经历",
  workExperiences: "工作经历",
  educations: "教育经历",
  skills: "相关技能",
  others: "其他信息"
};

export function createEmptyProject(): ProjectItem {
  return {
    id: createItemId("project"),
    projectName: "",
    projectRole: "",
    projectTime: "",
    projectSummary: "",
    projectHighlights: [""],
    tools: ""
  };
}

export function createEmptyWork(): WorkItem {
  return {
    id: createItemId("work"),
    companyName: "",
    jobTitle: "",
    location: "",
    workTime: "",
    responsibilities: [""]
  };
}

export function createEmptyEducation(): EducationItem {
  return {
    id: createItemId("education"),
    schoolName: "",
    major: "",
    degree: "",
    educationTime: "",
    notes: [""]
  };
}

export const defaultResumeData: ResumeData = {
  basicInfo: {
    name: "候选人",
    phone: "1**-****-****",
    email: "candidate@example.com",
    wechat: "wechat_redacted"
  },
  coreStrengths: [
    "前端工程化与组件开发",
    "React / TypeScript 项目实践",
    "接口联调与状态管理",
    "性能优化与问题排查",
    "自动化测试与代码质量"
  ],
  projects: [
    {
      id: "project-1",
      projectName: "Web 管理系统项目",
      projectRole: "前端开发",
      projectTime: "20XX.XX-20XX.XX",
      projectSummary: "负责后台管理系统核心页面开发、接口联调和交互体验优化。",
      projectHighlights: [
        "基于 React 和 TypeScript 完成列表、表单、详情等核心模块",
        "封装通用组件和数据处理方法，提升页面开发效率",
        "配合后端完成接口联调，处理 loading、空状态和异常提示"
      ],
      tools: "React、TypeScript、Vite、Axios"
    }
  ],
  workExperiences: [
    {
      id: "work-1",
      companyName: "工作单位已脱敏",
      jobTitle: "前端开发工程师",
      location: "城市已脱敏",
      workTime: "20XX.XX-20XX.XX",
      responsibilities: [
        "负责业务页面开发、组件拆分和前端交互实现",
        "参与需求评审、接口定义确认和前后端联调",
        "维护项目代码规范，配合完成缺陷修复和版本迭代"
      ]
    }
  ],
  educations: [
    {
      id: "education-1",
      schoolName: "学校名称已脱敏",
      major: "计算机科学与技术",
      degree: "本科",
      educationTime: "20XX.XX-20XX.XX",
      notes: [
        "主修数据结构、计算机网络、数据库系统、操作系统等课程",
        "参与课程项目开发，具备基础工程实践经验"
      ]
    }
  ],
  skills: {
    languages: ["英语 CET-6"],
    tools: ["JavaScript", "TypeScript", "React", "Vite", "Git", "RESTful API"],
    interests: ["技术博客", "开源项目", "算法练习"]
  },
  others: ["可根据前端开发、软件开发、测试开发等岗位方向调整项目重点"]
};
