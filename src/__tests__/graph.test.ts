import * as path from "path";
import {Project} from "@yarnpkg/core";
import {
  getDependers,
  getProject,
  getWorkspace,
  getWorkspaceByFilepath
} from "../utils/workspaces";
import {normalize} from "../main";
import "jest-extended";

const ROOT_DIR = path.resolve(__dirname, "../__fixtures__");
const PACKAGES_DIR = path.join(ROOT_DIR, "packages");

describe("utils", () => {
  describe("WorkspaceUtil", () => {
    let project: Project;

    beforeEach(async () => {
      project = await getProject(ROOT_DIR);
    });

    it("returns pkg_a with changed file in dir_a", async () => {
      const actual = await getWorkspaceByFilepath(
        project,
        path.join(PACKAGES_DIR, "dir_a/src/file_a.js")
      );
      expect(actual.locator.name).toEqual("pkg_a");
    });

    it("returns pkg_b with changed file in dir_b", async () => {
      const actual = await getWorkspaceByFilepath(
        project,
        path.join(PACKAGES_DIR, "dir_b/src/file_b.js")
      );
      expect(actual.locator.name).toEqual("pkg_b");
    });

    it("returns pkg_c with changed file in dir_c", async () => {
      const actual = await getWorkspaceByFilepath(
        project,
        path.join(PACKAGES_DIR, "dir_c/src/file_c.js")
      );
      expect(actual.locator.name).toEqual("pkg_c");
    });

    it("returns root workspace when file does not exist", async () => {
      const actual = await getWorkspaceByFilepath(
        project,
        path.join(PACKAGES_DIR, "non_existing_package/src/non_existing_file.js")
      );
      expect(actual.locator.name).toEqual("root");
    });

    it("identifies pkg_b as a dependency of pkg_a", async () => {
      const dependent = getWorkspace(project, "pkg_b");

      const deps = await getDependers(project, dependent);
      expect(deps).toBeArrayOfSize(1);
      expect(deps[0].manifest.raw).toContainEntry(["name", "pkg_a"]);
    });

    it("identifies pkg_c as a dependency of pkg_b", async () => {
      const dependent = getWorkspace(project, "pkg_c");

      const deps = await getDependers(project, dependent);
      expect(deps).toBeArrayOfSize(1);
      expect(deps[0].manifest.raw).toContainEntry(["name", "pkg_b"]);
    });
  });

  describe("filters", () => {
    it("filters out root workspaces", () => {
      const targets = ["get-changed-workspaces", "plugins"];

      const actual = normalize(targets);

      expect(actual).toStrictEqual([]);
    });

    it("filters out serverside/frontend/widgets workspaces", () => {
      const targets = ["pkg_a-serverside", "pkg_a-widgets", "pkg_a-frontend", "pkg_a"];

      const actual = normalize(targets);

      expect(actual).toStrictEqual(["pkg_a"]);
    });
  });
});
