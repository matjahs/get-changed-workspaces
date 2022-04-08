module.exports = {
  clearMocks: true,
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/__tests__/**/*\.test\.ts"],
  transformIgnorePatterns: [
    "<rootDir>\/node_modules\/pkg-up\/index\.js"
  ],
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  setupFilesAfterEnv: ["jest-extended/all"],
  verbose: true
};
