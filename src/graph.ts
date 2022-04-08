import path from "path";
import * as core from "@actions/core";
import {Configuration, Descriptor, IdentHash, Project, Workspace} from "@yarnpkg/core";
import {Filename, npath} from "@yarnpkg/fslib";

interface GraphNode {
  workspaceId: string;
  workspaceDir: string;
  dependencies: Map<IdentHash, Descriptor>;
  dependents: Map<IdentHash, Descriptor>;
}

type Graph = Record<string, GraphNode>;

interface Graphs {
  byId: Graph;
  byDir: Graph;
}

export class YarnGraph {
  private graph: Graphs;

  constructor(workspaceList: Workspace[]) {
    // workspaceList[0].project.getWorkspaceByFilePath();

    this.graph = YarnGraph.buildGraph(workspaceList);
  }

  getRecursiveDependents(...initialIds: string[]): string[] {
    const resultSet = new Set<string>();

    // breadth-first search
    const queue = [...initialIds];
    for (const id of queue) {
      if (!resultSet.has(id)) {
        resultSet.add(id);
        const node = this.graph.byId[id];
        if (!node) {
          core.setFailed(`Workspace '${id}' not registered in root worktree`);
          return [];
        }
        resultSet.add(id);
        for (const dependent of node.dependents) {
          core.info(`${dependent} depends on ${node.workspaceId}`);
        }
        // @ts-expect-error Argument of type '[IdentHash, Descriptor]' is not assignable to parameter of type 'string
        queue.push(...node.dependents);
      }
    }

    return [...resultSet];
  }

  async getWorkspacesForFiles(...files: string[]): Promise<string[]> {
    const resultSet = new Set<string>();

    const cwd = npath.toPortablePath(process.cwd());
    const projectCwd = await Configuration.findProjectCwd(cwd, Filename.lockfile);
    if (projectCwd === null) {
      core.setFailed("Could not find yarn.lock file");
      return [];
    }
    const configuration = await Configuration.find(cwd, null);
    const {project} = await Project.find(configuration, projectCwd);

    const workspaceDirs = new Set(
      await Promise.all(
        files.map(async file => {
          const filepath = npath.toPortablePath(file);
          const workspace = project.getWorkspaceByFilePath(filepath);
          const workspaceDir = workspace.relativeCwd;

          if (workspaceDir === undefined || workspaceDir === null) {
            core.warning(`Workspace not found for file '${file}'`);
          }
          return workspaceDir;
        })
      )
    );

    for (const workspaceDir of workspaceDirs) {
      if (workspaceDir === undefined || workspaceDir === null) continue;
      const workspaceId = this.getWorkspaceId(workspaceDir);
      resultSet.add(workspaceId);
    }

    return [...resultSet];
  }

  private getWorkspaceId(dir: string): string {
    const id = this.graph.byDir[path.resolve(dir)]?.workspaceId;
    if (!id) {
      core.setFailed(`Workspace at '${dir}' not registered in root worktree`);
      return "";
    }
    return id;
  }

  private static buildGraph(items: Workspace[]): Graphs {
    const graphById: Graph = {};
    const dirToId: Record<string, string> = {};

    // build initial graph with dependency links
    for (const item of items) {
      const node = (graphById[item.locator.name] = {
        workspaceId: item.locator.name,
        workspaceDir: item.relativeCwd,
        dependencies: item.dependencies,
        dependents: new Map([])
      });
      dirToId[node.workspaceDir] = node.workspaceId;
    }

    // build the reverse dependency links
    for (const item of items) {
      const name = item.locator.name;
      for (const depLocation of item.dependencies) {
        // @ts-expect-error Argument of type '[IdentHash, Descriptor]' is not assignable to parameter of type 'string'.
        graphById[dirToId[path.resolve(depLocation)]].dependents.push(name);
      }
    }

    // populate the graph with directory lookup too
    const graphByDir: Graph = {};

    for (const node of Object.values(graphById)) {
      graphByDir[node.workspaceDir] = node;
    }

    return {byId: graphById, byDir: graphByDir};
  }
}
