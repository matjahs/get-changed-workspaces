import {YarnWorkspacesListItem} from '../src/list'
import {YarnGraph} from '../src/graph'
import * as tmp from 'tmp'
import mkdirp from 'mkdirp'
import fs from 'fs-jetpack'
import * as path from 'path'
import execa from 'execa'

const setup = (): tmp.DirResult => {
  const tmpdir = tmp.dirSync({
    unsafeCleanup: true
  })
  mkdirp.sync(`${tmpdir.name}/dir/test_subdir`)

  fs.copy(path.join(__dirname, '../__fixtures__'), `${tmpdir.name}`, {
    overwrite: true
  })
  fs.copy(
    path.join(__dirname, '../__fixtures__/package.json'),
    `${tmpdir.name}/package.json`,
    {
      overwrite: true
    }
  )

  execa.sync('yarn', ['set', 'version', 'berry'], {
    stdio: 'inherit',
    cwd: tmpdir.name
  })
  execa.sync('yarn', ['install'], {
    stdio: 'inherit',
    cwd: tmpdir.name
  })

  return tmpdir
}

const workspaceList: YarnWorkspacesListItem[] = [
  {
    location: 'dir_a',
    name: 'dir_a',
    workspaceDependencies: []
  },
  {
    location: 'dir_b',
    name: 'dir_b',
    workspaceDependencies: []
  }
]

describe('', () => {
  let dir: tmp.DirResult
  let clean: () => void

  beforeEach(() => {
    dir = setup()
    clean = () => dir.removeCallback()
  })
  afterEach(() => {
    if (typeof clean == 'function') {
      clean()
    }
  })

  // it('sets up a mini monorepo', async () => {
  //   const ws = await listYarnWorkspaces(dir.name)
  // })

  it.skip('returns workspace with changed file', async () => {
    process.chdir(dir.name)
    const graph = new YarnGraph(workspaceList)
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(graph, null, 2))
    const actual = await graph.getWorkspacesForFiles(
      `${dir}/test/dir_a/file_a.js`
    )

    expect(actual).toEqual('pkg_a')
  })
})
