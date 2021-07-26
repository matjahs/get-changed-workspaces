import {npath, PortablePath} from "@yarnpkg/fslib";
import {Configuration, Project, Workspace} from "@yarnpkg/core";
import * as core from "@actions/core";
import pkgUp from "pkg-up";

const PLUGIN_DIRS = ["apps/", "plugins/certified/"];

export const isPluginCwd = (cwd: string): boolean =>
  PLUGIN_DIRS.some(dir => cwd.startsWith(dir));

const getConfiguration = (p: PortablePath): Configuration => {
  return Configuration.create(p, p, new Map([]));
};

export const getPluginWorkspaces = async (
  exclude = ["plugins", "get-changed-workspaces"]
): Promise<Workspace[]> => {
  const dir = npath.toPortablePath(process.cwd());

  const configuration = getConfiguration(dir);
  const {project} = await Project.find(configuration, dir);

  return project.workspaces.filter(
    ws => isPluginCwd(ws.relativeCwd) && !exclude.includes(ws.locator.name)
  );
};

export const getProject = async (dir = process.cwd()): Promise<Project> => {
  const dirPath = npath.toPortablePath(dir);
  const config = getConfiguration(dirPath);
  const {project} = await Project.find(config, dirPath);

  return project;
};

export const getWorkspace = (project: Project, name: string): Workspace => {
  const ws = project.workspaces.find(
    (workspace: Workspace) => workspace.locator.name === name
  );
  if (!ws) {
    throw new Error(`failed to find workspace with name: '${name}'`);
  }
  return ws;
};

export const getDependers = async (
  project: Project,
  dependee: Workspace
): Promise<Workspace[]> => {
  core.startGroup(
    `resolving workspaces (dependers) that depend on dependee ${dependee.computeCandidateName()}`
  );
  const dependers = [];
  for (const ws of project.workspaces) {
    if (ws.manifest.hasConsumerDependency(dependee.locator)) {
      dependers.push(ws);
    }
  }
  return dependers;
};

export const getWorkspaceByFilepath = async (
  project: Project,
  file: string
): Promise<Workspace> => {
  // First find the package.json that this file belongs to.
  const pkgJson = await pkgUp({cwd: file});
  if (!pkgJson) {
    throw new Error(`failed to locate nearest package.json for file: ${file}`);
  }

  // Use Yarn API to resolve package.json to a workspace
  const filepath = npath.toPortablePath(pkgJson);
  const ws = project.getWorkspaceByFilePath(filepath);

  core.info(`${file}-->${ws.locator.name}`);

  return ws;
};

export const getWorkspacesForFiles = async (
  project: Project,
  ...files: string[]
): Promise<Workspace[]> => {
  return await Promise.all(
    files.map(async file => getWorkspaceByFilepath(project, file))
  );
};

// export class WorkspaceUtil {
//   #dir: PortablePath;
//   #config: Configuration;
//   #project: Project;
//   #builder: ProjectGraphBuilder;
//
//   constructor(dir = process.cwd()) {
//     this.#dir = npath.toPortablePath(dir);
//     this.#config = getConfiguration(this.#dir);
//     this.#builder = new ProjectGraphBuilder();
//   }
//
//   async init(): Promise<Project> {
//     const {project} = await Project.find(this.#config, this.#dir);
//     return project;
//   }
//
//   get project(): Project | undefined {
//     return this.#project;
//   }
//
//   async getWorkspaceByFilepath(file: string): Promise<Workspace> {
//     if (!this.#project) {
//       this.#project = await this.init();
//     }
//
//     const pkgJson = await pkgUp({cwd: file});
//     if (!pkgJson) {
//       throw new Error(`failed to locate nearest package.json for file: ${file}`);
//     }
//
//     const filepath = npath.toPortablePath(pkgJson);
//
//     const ws = this.#project.getWorkspaceByFilePath(filepath);
//
//     core.info(`${file}-->${ws.locator.name}`);
//
//     return ws;
//   }
//
//   async getWorkspacesForFiles(...files: string[]): Promise<Map<string, Workspace>> {
//     core.startGroup("locating workspaces for files...");
//     const workspaces = new Map<string, Workspace>([]);
//
//     for (const file of files) {
//       const ws = await this.getWorkspaceByFilepath(file);
//       workspaces.set(file, ws);
//       core.info(`${file} -> ${ws.locator.name}`);
//     }
//
//     core.endGroup();
//     return workspaces;
//   }
//
//   async getWorkspaceNamesForFiles(...files: string[]): Promise<string[]> {
//     const workspaces = await this.getWorkspacesForFiles(...files);
//
//     const names = [];
//     for (const ws of workspaces.values()) {
//       names.push(ws.locator.name);
//     }
//
//     return names;
//   }
//
//   async buildGraph() {
//     if (!this.#project) {
//       this.#project = await this.init();
//     }
//     for (const ws of this.#project.workspaces) {
//       const deps = ws.getRecursiveWorkspaceChildren();
//       for (const dep of deps) {
//         dep;
//       }
//     }
//   }
// }
