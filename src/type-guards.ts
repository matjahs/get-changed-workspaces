import {BcWorkspace, PackageWorkspace, PluginWorkspace, UtilWorkspace} from "./types";

const isObject = (arg: unknown): arg is Record<string, never> => {
  return Object.prototype.toString.call(arg) === "[object Object]";
};

export const isBcWorkspace = (arg: unknown): arg is BcWorkspace => {
  return (
    isObject(arg) &&
    Object.prototype.hasOwnProperty.call(arg, "pluginType") &&
    arg.pluginType &&
    ["plugin", "package", "util"].includes(arg.pluginType) &&
    /^(plugins|apps)/.test(arg.relativeCwd)
  );
};

export const isPluginWorkspace = (arg: BcWorkspace): arg is PluginWorkspace => {
  return (
    isBcWorkspace(arg) &&
    arg.pluginType === "plugin" &&
    /^(?:apps|plugins\/certified)\//.test(arg.relativeCwd)
  );
};

export const isPackageWorkspace = (arg: BcWorkspace): arg is PackageWorkspace => {
  return (
    isBcWorkspace(arg) &&
    arg.pluginType === "package" &&
    /^(?:plugins\/)?packages\//.test(arg.relativeCwd)
  );
};

export const isUtilWorkspace = (arg: BcWorkspace): arg is UtilWorkspace => {
  return (
    isBcWorkspace(arg) &&
    arg.pluginType === "util" &&
    arg.relativeCwd.startsWith("utilities/")
  );
};
