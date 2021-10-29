module.exports = {
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json"
    }
  },
  preset: "ts-jest",
  clearMocks: true,
  moduleFileExtensions: ["js", "ts"],
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  setupFilesAfterEnv: ["jest-extended/all"],
  testRunner: "jest-circus/runner",
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  verbose: true
};
