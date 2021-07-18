import path from 'path'

import * as core from '@actions/core'
import pkgDir from 'pkg-dir'

import {YarnWorkspacesListItem} from './list-workspaces'

interface GraphNode {
  workspaceId: string
  workspaceDir: string
  dependencies: string[]
  dependents: string[]
}

type Graph = Record<string, GraphNode>

interface Graphs {
  byId: Graph
  byDir: Graph
}

export class YarnGraph {
  private graph: Graphs

  constructor(workspaceList: YarnWorkspacesListItem[]) {
    this.graph = YarnGraph.buildGraph(workspaceList)
  }

  getRecursiveDependents(...initialIds: string[]): string[] {
    const resultSet = new Set<string>()

    // breadth-first search
    const queue = [...initialIds]
    for (const id of queue) {
      if (!resultSet.has(id)) {
        resultSet.add(id)
        const node = this.graph.byId[id]
        if (!node) {
          core.setFailed(`Workspace '${id}' not registered in root worktree`)
          return []
        }
        resultSet.add(id)
        for (const dependent of node.dependents) {
          core.info(`${dependent} depends on ${node.workspaceId}`)
        }
        queue.push(...node.dependents)
      }
    }

    return [...resultSet]
  }

  async getWorkspacesForFiles(...files: string[]): Promise<string[]> {
    const resultSet = new Set<string>()

    const workspaceDirs = new Set(
      await Promise.all(
        files.map(async file => {
          const workspaceDir = await pkgDir(path.dirname(path.resolve(file)))
          if (workspaceDir === undefined) {
            core.warning(`Workspace not found for file '${file}'`)
          }
          return workspaceDir
        })
      )
    )

    for (const workspaceDir of workspaceDirs) {
      if (workspaceDir === undefined) continue
      const workspaceId = this.getWorkspaceId(workspaceDir)
      resultSet.add(workspaceId)
    }

    return [...resultSet]
  }

  private getWorkspaceId(dir: string): string {
    const id = this.graph.byDir[path.resolve(dir)]?.workspaceId
    if (!id) {
      core.setFailed(`Workspace at '${dir}' not registered in root worktree`)
      return ''
    }
    return id
  }

  private static buildGraph(items: YarnWorkspacesListItem[]): Graphs {
    const graphById: Graph = {}
    const dirToId: Record<string, string> = {}

    // build initial graph with dependency links
    for (const item of items) {
      const node = (graphById[item.name] = {
        workspaceId: item.name,
        workspaceDir: path.resolve(item.location),
        dependencies: item.workspaceDependencies,
        dependents: []
      })
      dirToId[node.workspaceDir] = node.workspaceId
    }

    // build the reverse dependency links
    for (const item of items) {
      const name = item.name
      for (const depLocation of item.workspaceDependencies) {
        graphById[dirToId[path.resolve(depLocation)]].dependents.push(name)
      }
    }

    // populate the graph with directory lookup too
    const graphByDir: Graph = {}

    for (const node of Object.values(graphById)) {
      graphByDir[node.workspaceDir] = node
    }

    return {byId: graphById, byDir: graphByDir}
  }
}
