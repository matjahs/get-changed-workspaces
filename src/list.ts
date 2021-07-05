import * as exec from '@actions/exec'
import * as path from 'path'

export interface YarnWorkspacesListItem {
  location: string
  name: string
  workspaceDependencies: string[]
}

export const listYarnWorkspaces = async (
  root?: string
): Promise<YarnWorkspacesListItem[]> => {
  const output: Buffer[] = []
  await exec.exec('yarn workspaces', ['list', '-v', '--json'], {
    silent: true,
    listeners: {
      stdout: data => {
        output.push(data)
      }
    },
    cwd: root ? path.resolve(root) : process.env.GITHUB_WORKSPACE
  })
  return output
    .join('')
    .trim()
    .split('\n')
    .map(str => JSON.parse(str))
}

export default listYarnWorkspaces
