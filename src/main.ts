import * as core from '@actions/core'
import fs from 'fs-jetpack'
import * as path from 'path'

import listYarnWorkspaces from './list-workspaces'
import {YarnGraph} from './graph'

const rootWorkspace = fs.read(path.join(__dirname, "../package.json"), 'json').name
const subPackageRegex = /-(serverside|widgets|frontend)$/

export const normalize = (targetWorkspaces: string[]): string[] => {
  const filtered = new Set<string>([]);

  for (const ws of targetWorkspaces) {
    filtered.add(ws.replace(subPackageRegex, ''))
  }

  return Array.from(filtered)
    .filter(ws => ws !== rootWorkspace)
}

export const main = async (): Promise<void> => {
  try {
    const files: string[] = JSON.parse(core.getInput('files', {required: true}))

    core.info('Building worktree dependency graph')
    const graph = new YarnGraph(await listYarnWorkspaces())

    core.startGroup('Identifying directly modified workspaces')
    const changedWorkspaces = await graph.getWorkspacesForFiles(...files)
    core.endGroup()
    core.info(`Affected workspaces [${changedWorkspaces.join(', ')}]`)

    core.startGroup('Identifying dependent workspaces')
    const targetWorkspaces = graph.getRecursiveDependents(...changedWorkspaces)
    core.endGroup()
    core.info(`Target workspaces [${targetWorkspaces.join(', ')}]`)

    const normalizedWorkspaces = normalize(targetWorkspaces)

    core.setOutput('targets', normalizedWorkspaces)
  } catch (err) {
    core.setFailed(err)
  }
}

main()
