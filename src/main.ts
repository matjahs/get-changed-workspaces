import * as core from "@actions/core";
import {getDependers, getProject, getWorkspacesForFiles} from "./utils/workspaces";
import {Workspace} from "@yarnpkg/core";

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

  const withoutRoot = Array.from(filtered)
    .filter(ws => !isRootWorkspace(ws))
    .filter(ws => ws !== "");
  core.endGroup();
  return withoutRoot;
};

export const main = async (): Promise<void> => {
  try {
    const input = core.getInput("files");
    const files: string[] = JSON.parse(input);

    core.info("Building worktree dependency graph");
    const project = await getProject(process.cwd());

    core.startGroup("Identifying directly modified workspaces");
    const changedWorkspaces = await getWorkspacesForFiles(project, ...files);
    core.endGroup();
    core.info(`Affected workspaces [${changedWorkspaces.join(", ")}]`);

    core.startGroup("Identifying dependent workspaces");
    const deps: Workspace[] = [];
    for (const changedWorkspace of changedWorkspaces) {
      const x = await getDependers(project, changedWorkspace);
      deps.concat(x);
    }
    // const targetWorkspaces: Workspace[] = await Promise.all(
    //   changedWorkspaces.map(async ws => getDependers(project, ws))
    // );
    core.info(`Target workspaces [${deps.join(", ")}]`);
    core.endGroup();

    const normalizedWorkspaces: string[] = normalize([
      ...changedWorkspaces.map(ws => ws.locator.name),
      ...deps.map(dep => dep.locator.name)
    ]);

    core.setOutput("targets", normalizedWorkspaces);
  } catch (err) {
    core.setFailed(err);
  }
};

main();
