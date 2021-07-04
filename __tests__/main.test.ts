import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import * as tmp from 'tmp'
import * as mkdirp from 'mkdirp'

const prepare = () => {
  const tmpobj = tmp.dirSync()
  mkdirp.sync(tmpobj.name + '/')
}

test.skip('throws invalid number', async () => {
  // const input = parseInt('foo', 10)
  // await expect(wait(input)).rejects.toThrow('milliseconds not a number')
})

test.skip('wait 500 ms', async () => {
  const start = new Date()
  // await wait(500)
  const end = new Date()
  // eslint-disable-next-line no-var
  var delta = Math.abs(end.getTime() - start.getTime())
  expect(delta).toBeGreaterThan(450)
})

// shows how the runner will run a javascript action with env / stdout protocol
test.skip('test runs', () => {
  process.env['INPUT_FILES'] = '[]'
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  // eslint-disable-next-line no-console
  console.log(cp.execFileSync(np, [ip], options).toString())
})
