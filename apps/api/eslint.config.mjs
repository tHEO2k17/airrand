import baseConfig from "@airrand/config/eslint/base.mjs";

const databaseSchemaTables = [
  "merchants",
  "merchantUsers",
  "products",
  "productCategories",
  "orders",
  "orderLines",
  "auditLogs",
  "auditExportJobs",
  "notificationJobs",
];

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    files: ["src/routes/**/*.ts"],
    rules: {
      // Phase 0 guardrail: warn while legacy routes still inline Drizzle (Phase 1b+).
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "@airrand/database",
              importNames: databaseSchemaTables,
              message:
                "Route files should not import Drizzle schema tables. Use query/command handlers and repositories/ instead.",
            },
          ],
        },
      ],
    },
  },
];
