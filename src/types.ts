import type {Workspace} from "@yarnpkg/core";

export interface PluginWorkspace extends Workspace {
  readonly pluginType: "plugin";
}

export interface PackageWorkspace extends Workspace {
  readonly pluginType: "package";
}

export interface UtilWorkspace extends Workspace {
  readonly pluginType: "util";
}

export type BcWorkspace = PluginWorkspace | PackageWorkspace | UtilWorkspace;
