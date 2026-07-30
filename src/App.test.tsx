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

  it("syncs basic info changes into the preview", async () => {
    const user = userEvent.setup();
    render(<App />);

    const nameInput = screen.getByLabelText("姓名");
    await user.clear(nameInput);
    await user.type(nameInput, "王敏");

    expect(screen.getByText("王敏")).toBeInTheDocument();
  });

  it("exports the resume through window.print", async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(<App />);
    await user.click(screen.getByRole("button", { name: "导出 PDF" }));

    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it("adds a project entry and renders it in the preview", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "新增项目经历" }));
    const projectNameInputs = screen.getAllByLabelText("项目名称");
    await user.type(projectNameInputs[projectNameInputs.length - 1], "智慧园区管理平台");

    expect(screen.getByText("智慧园区管理平台")).toBeInTheDocument();
  });

  it("renders center and right stacked meta columns for preview entries", () => {
    const { container } = render(<App />);

    const centerColumns = container.querySelectorAll(".entry-center");
    const rightColumns = container.querySelectorAll(".entry-right");

    expect(centerColumns.length).toBeGreaterThanOrEqual(3);
    expect(centerColumns[0]).toHaveTextContent("前端开发");
    expect(centerColumns[1]).toHaveTextContent("前端开发工程师");
    expect(centerColumns[2]).toHaveTextContent("计算机科学与技术");

    expect(rightColumns.length).toBeGreaterThanOrEqual(3);
    expect(rightColumns[1]).toHaveTextContent("城市已脱敏");
    expect(rightColumns[1]).toHaveTextContent("20XX.XX-20XX.XX");
    expect(rightColumns[2]).toHaveTextContent("本科");
    expect(rightColumns[2]).toHaveTextContent("20XX.XX-20XX.XX");
  });

  it("shows layout controls and toggles the grid overlay", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "开启排版模式" }));
    await user.click(screen.getByRole("button", { name: "显示网格线" }));

    expect(screen.getByRole("button", { name: "重置排版" })).toBeInTheDocument();
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

  it("syncs editable section titles into the preview", async () => {
    const user = userEvent.setup();
    render(<App />);

    const titleInput = screen.getByLabelText("核心优势模块标题");
    await user.clear(titleInput);
    await user.type(titleInput, "个人擅长");

    expect(screen.getByDisplayValue("个人擅长")).toBeInTheDocument();
    expect(screen.getAllByText("个人擅长").length).toBeGreaterThanOrEqual(2);
  });

  it("falls back to the default title when a section title is cleared", async () => {
    const user = userEvent.setup();
    render(<App />);

    const titleInput = screen.getByLabelText("项目经历模块标题");
    await user.clear(titleInput);
    await user.tab();

    expect(screen.getByDisplayValue("项目经历")).toBeInTheDocument();
  });

  it("shows rulers and draggable sections in layout mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "开启排版模式" }));

    expect(screen.getByTestId("horizontal-ruler")).toBeInTheDocument();
    expect(screen.getByTestId("vertical-ruler")).toBeInTheDocument();
    expect(screen.getByTestId("section-projects")).toBeInTheDocument();
    expect(screen.getByTestId("section-workExperiences")).toBeInTheDocument();
  });
});
