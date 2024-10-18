import type { Config } from "jest"

const config: Config = {
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/test/tsconfig.json"
      }
    ]
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/{app,common,companion,resources,settings}/**/*.{ts,js}"
  ],
  setupFiles: ["<rootDir>/app/__mocks__/globals.ts"],
  passWithNoTests: true,
  reporters: [["github-actions", { silent: false }], "default"],
  testEnvironment: "node",
  verbose: true
}

export default config
