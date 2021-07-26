import * as core from "@actions/core";
import {getDependers, getProject, getWorkspacesForFiles} from "./utils/workspaces";
import {Workspace} from "@yarnpkg/core";

const ROOT_WORKSPACES = ["plugins", "get-changed-workspaces", ""];

const isRootWorkspace = (name: string): boolean => {
  const isRoot = ROOT_WORKSPACES.includes(name);
  core.debug(`${name} is ${isRoot ? "" : "not "}a root workspace`);
  return ROOT_WORKSPACES.includes(name);
};

export const normalize = (targetWorkspaces: Workspace[]): string[] => {
  core.startGroup("normalizing...");
  const filtered = new Set<string>([]);

  for (const ws of targetWorkspaces) {
    if (/-(serverside|widgets|frontend)$/.test(ws.locator.name)) {
      core.info(
        `${ws.computeCandidateName()} end in serverside/widgets/frontend, skipping...`
      );
      continue;
    }
    if (!/^(plugins|apps)\//.test(ws.relativeCwd)) {
      core.info(
        `${ws.relativeCwd} does not start with either plugins/ or apps/, skipping...`
      );
      continue;
    }
    if (isRootWorkspace(ws.locator.name)) {
      core.info(`${ws.computeCandidateName()} is a root workspace, skipping...`);
      continue;
    }

    filtered.add(
      ws.locator.scope ? `@${ws.locator.scope}/${ws.locator.name}` : ws.locator.name
    );
  }

  core.endGroup();
  return Array.from(filtered);
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
      const dependers = await getDependers(project, changedWorkspace);
      deps.push(...dependers);
    }

    core.info(`Target workspaces [
    ${deps.join("\n")}
    ]`);
    core.endGroup();

    const normalizedWorkspaces: string[] = normalize([...changedWorkspaces, ...deps]);

    core.setOutput("targets", normalizedWorkspaces);
  } catch (err) {
    core.setFailed(err);
  }
};

main();
