import {getPluginWorkspaces} from "./utils/workspaces";

import type {Workspace} from "@yarnpkg/core";

export interface YarnWorkspacesListItem {
  location: string;
  name: string;
  workspaceDependencies: string[];
}

const listYarnWorkspaces = async (): Promise<Workspace[]> => {
  return await getPluginWorkspaces();
};

export default listYarnWorkspaces;
