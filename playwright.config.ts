import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config.
 *
 * By default runs against the published site. Override with E2E_BASE_URL
 * (e.g. preview URL or http://localhost:4173 after `bun run preview`).
 *
 * NOT wired into prebuild — run manually with `bun run e2e`.
 */
const baseURL =
  process.env.E2E_BASE_URL ??
  "https://id-preview--8ea4db22-ffb2-4b9e-b208-50e490da8389.lovable.app";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
