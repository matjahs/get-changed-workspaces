import * as core from "@actions/core";

import listYarnWorkspaces from "./list-workspaces";
import {YarnGraph} from "./graph";

const subPackageRegex = /-(serverside|widgets|frontend)$/;

const ROOT_WORKSPACES = ["plugins", "get-changed-workspaces"];

const isRootWorkspace = (name: string): boolean => {
  const isRoot = ROOT_WORKSPACES.includes(name);
  core.debug(`${name} is ${isRoot ? "" : "not "}a root workspace`);
  return ROOT_WORKSPACES.includes(name);
};

export const normalize = (targetWorkspaces: string[]): string[] => {
  core.startGroup("normalizing...");
  const filtered = new Set<string>([]);

  for (const ws of targetWorkspaces) {
    filtered.add(ws.replace(subPackageRegex, ""));
  }

  const withoutRoot = Array.from(filtered).filter(ws => !isRootWorkspace(ws));
  core.endGroup();
  return withoutRoot;
};

export const main = async (): Promise<void> => {
  try {
    const input = core.getInput("files");
    const files: string[] = JSON.parse(input);

    core.info("Building worktree dependency graph");
    const graph = new YarnGraph(await listYarnWorkspaces());

    core.startGroup("Identifying directly modified workspaces");
    const changedWorkspaces = await graph.getWorkspacesForFiles(...files);
    core.endGroup();
    core.info(`Affected workspaces [${changedWorkspaces.join(", ")}]`);

    core.startGroup("Identifying dependent workspaces");
    const targetWorkspaces = graph.getRecursiveDependents(...changedWorkspaces);
    core.info(`Target workspaces [${targetWorkspaces.join(", ")}]`);
    core.endGroup();

    const normalizedWorkspaces = normalize(targetWorkspaces);

    core.setOutput("targets", normalizedWorkspaces);
  } catch (err) {
    core.setFailed(err);
  }
};

main();
