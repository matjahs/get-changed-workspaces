import {YarnWorkspacesListItem} from '../src/list'
import {YarnGraph} from '../src/graph'

const workspaceList: YarnWorkspacesListItem[] = [
  {
    location: 'plugins/packages/widgets/litWidget',
    name: '@blueconic/widgets-lit',
    workspaceDependencies: []
  },
  {
    location: 'plugins/packages/widgets/mapping',
    name: '@blueconic/widgets-mapping',
    workspaceDependencies: []
  },
  {
    location: 'plugins/packages/widgets/mappingstep',
    name: '@blueconic/widgets-mappingstep',
    workspaceDependencies: []
  },
  {
    location: 'plugins/packages/widgets/metric_selector',
    name: '@blueconic/widgets-metric-selector',
    workspaceDependencies: []
  }
]

test('', () => {
  const graph = new YarnGraph(workspaceList)
})
