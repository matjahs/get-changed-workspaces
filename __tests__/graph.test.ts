import {YarnWorkspacesListItem} from '../src/list-workspaces'
import {YarnGraph} from '../src/graph'
import fss from 'fs-jetpack'
import * as path from 'path'
import {normalize} from '../src/main'
const TMP_TEST_DIR = path.resolve(__dirname, '../.tmp')

interface TmpDir {
  name: string
  teardown: () => void
}

const setup = (): TmpDir => {
  const tmpdir = TMP_TEST_DIR

  if (fss.exists(tmpdir)) {
    throw new Error(`path already exists: ${tmpdir}`)
  }

  fss.copy(path.join(__dirname, `../__fixtures__/`), `${tmpdir}`, {
    overwrite: true
  })

  const pkgJsonPath = path.join(__dirname, '../package.json')
  const orgJson = fss.read(pkgJsonPath, 'json')
  const json = orgJson
  json['workspaces'] = {packages: ['.tmp/*']}
  fss.write(pkgJsonPath, json, {jsonIndent: 2})

  return {
    name: tmpdir,
    teardown: () => {
      fss.remove(tmpdir)
      fss.write(pkgJsonPath, orgJson, {jsonIndent: 2})
    }
  }
}

const workspaceList: YarnWorkspacesListItem[] = [
  {"location":".","name":"get-changed-workspaces",workspaceDependencies:[]},
  {"location":".tmp/dir_a","name":"pkg_a",workspaceDependencies:[]},
  {"location":".tmp/dir_b","name":"pkg_b",workspaceDependencies:[]}
]

describe('graph', () => {
  let testDir: string
  let teardown: () => void | undefined

  beforeEach(() => {
    const res = setup()
    testDir = res.name
    teardown = res.teardown
  })

  afterEach(() => {
    teardown()
  })

  // it('sets up a mini monorepo', async () => {
  //   const ws = await listYarnWorkspaces(testDir)
  // })

  it('returns pkg_a with changed file in dir_a', async () => {
    const graph = new YarnGraph(workspaceList)
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(graph, null, 2))

    const actual = await graph.getWorkspacesForFiles(
      path.join(testDir, 'dir_a/file_a.js')
    )
    expect(actual).toEqual(['pkg_a'])
  })

  it('returns pkg_b with changed file in dir_b', async () => {
    const graph = new YarnGraph(workspaceList)
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(graph, null, 2))

    const actual = await graph.getWorkspacesForFiles(
      path.join(testDir, 'dir_b/file_b.js')
    )
    expect(actual).toEqual(['pkg_b'])
  })

  it('returns root workspace when file does not exist', async () => {
    const graph = new YarnGraph(workspaceList)
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(graph, null, 2))

    const actual = await graph.getWorkspacesForFiles(
      path.join(testDir, 'dir_c/file_c.js')
    )
    expect(actual).toEqual(['get-changed-workspaces'])
  })
})

describe('filters', () => {
  it('filters out root workspace',  () => {
    const targets = ['get-changed-workspaces'];

    const actual = normalize(targets);

    expect(actual).toStrictEqual([])
  })

  it('filters out serverside/frontend/widgets workspaces',  () => {
    const targets = ['pkg_a-serverside','pkg_a-widgets','pkg_a-frontend', 'pkg_a'];

    const actual = normalize(targets);

    expect(actual).toStrictEqual(['pkg_a'])
  })
})