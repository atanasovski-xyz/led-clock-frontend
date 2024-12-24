#!/usr/bin/env node

// Generates renovate config to fix @types and package running out of sync
// See https://github.com/renovatebot/renovate/issues/4893

const path = require("path");
const fs = require("fs");

// This script lies under scripts/update-renovate.js, therefore the ..
const renovatePath = path.resolve(__dirname, "../renovate.json");
const renovateConfig = require(renovatePath);
// packages relative to root
const packages = ["."];

const detypify = (typedName) =>
  typedName.replace("@types/", "").replace("__", "/");

renovateConfig.packageRules = packages
  .map((p) => path.resolve(__dirname, "..", p, "package.json"))
  .map((path) => require(path))
  .map((package) =>
    Object.keys(package.dependencies || {}).concat(
      ...Object.keys(package.devDependencies || {})
    )
  )
  .reduce((acc, cur) => [...acc, ...cur], [])
  .filter((value, index, self) => self.indexOf(value) === index)
  .filter((dep) => dep.includes("@types/"))
  .map((typesPackage) => ({
    packagePatterns: [typesPackage, detypify(typesPackage)],
    groupName: detypify(typesPackage),
  }));

fs.writeFileSync(
  renovatePath,
  JSON.stringify(renovateConfig, null, 2),
  "utf-8"
);
