import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as jsonc from "jsonc-parser";

const ROOT = path.resolve(__dirname, "../..");
const TEMPLATES_DIR = path.join(ROOT, "templates");

describe("templates", () => {
  it("templates/docs/concert/state.json exists and is valid JSON", () => {
    const statePath = path.join(TEMPLATES_DIR, "docs", "concert", "state.json");
    expect(fs.existsSync(statePath)).toBe(true);
    const content = fs.readFileSync(statePath, "utf-8");
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it("state.json has all required default fields", () => {
    const statePath = path.join(TEMPLATES_DIR, "docs", "concert", "state.json");
    const state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
    expect(state).toHaveProperty("mission");
    expect(state).toHaveProperty("mission_path");
    expect(state).toHaveProperty("workflow");
    expect(state).toHaveProperty("branch");
    expect(state).toHaveProperty("pr_number");
    expect(state).toHaveProperty("stage");
    expect(state).toHaveProperty("pipeline");
    expect(state).toHaveProperty("phases_completed");
    expect(state).toHaveProperty("tasks_completed");
    expect(state).toHaveProperty("commits");
    expect(state).toHaveProperty("cost");
    expect(state).toHaveProperty("blockers");
    expect(state).toHaveProperty("telemetry");
    expect(state).toHaveProperty("failure_log");
    expect(state).toHaveProperty("history");
    expect(state).toHaveProperty("next_steps");
    expect(Array.isArray(state.blockers)).toBe(true);
    expect(Array.isArray(state.telemetry)).toBe(true);
    expect(Array.isArray(state.history)).toBe(true);
  });

  it("templates/concert.jsonc exists and is parseable JSONC", () => {
    const configPath = path.join(TEMPLATES_DIR, "concert.jsonc");
    expect(fs.existsSync(configPath)).toBe(true);
    const content = fs.readFileSync(configPath, "utf-8");
    const errors: jsonc.ParseError[] = [];
    const parsed = jsonc.parse(content, errors);
    expect(errors).toHaveLength(0);
    expect(parsed).not.toBeNull();
  });

  it("concert.jsonc has all required config fields", () => {
    const configPath = path.join(TEMPLATES_DIR, "concert.jsonc");
    const content = fs.readFileSync(configPath, "utf-8");
    const config = jsonc.parse(content);
    expect(config).toHaveProperty("project_name");
    expect(config).toHaveProperty("concert_version");
    expect(config).toHaveProperty("project");
    expect(config).toHaveProperty("git");
    expect(config).toHaveProperty("status_display");
    expect(config).toHaveProperty("interactive_mode");
    expect(config).toHaveProperty("execution");
    expect(config).toHaveProperty("review_triggers");
    expect(config).toHaveProperty("gates");
    expect(config).toHaveProperty("model_profiles");
    expect(config).toHaveProperty("task_models");
    expect(config).toHaveProperty("skills");
    expect(config).toHaveProperty("actions");
    expect(config).toHaveProperty("telemetry");
    expect(config).toHaveProperty("self_improvement");
    expect(config).toHaveProperty("user_guidance");
  });

  it("concert.jsonc has interactive_mode field with default claude_code_only", () => {
    const configPath = path.join(TEMPLATES_DIR, "concert.jsonc");
    const content = fs.readFileSync(configPath, "utf-8");
    const config = jsonc.parse(content);
    expect(config.interactive_mode).toBe("claude_code_only");
  });

  it("concert.jsonc has execution.max_review_iterations with default 3", () => {
    const configPath = path.join(TEMPLATES_DIR, "concert.jsonc");
    const content = fs.readFileSync(configPath, "utf-8");
    const config = jsonc.parse(content);
    expect(config.execution.max_review_iterations).toBe(3);
  });
});
