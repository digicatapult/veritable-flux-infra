module.exports = (config = {}) => {
  const isSelfHosted = process.env.RENOVATE_SELF_HOSTED === "true";

  if (!isSelfHosted) {
    console.log("Renovate is disabled when running via GitHub App.");
    return {
      enabled: false,
      onboarding: false,
    };
  }

  console.log("Renovate is running in self-hosted mode.");

  return {
    $schema: "https://docs.renovatebot.com/renovate-schema.json",
    onboarding: false,
    requireConfig: false,
    baseBranches: ["main"],
    extends: [":timezone(Europe/London)"],
    prHourlyLimit: 20,
    prConcurrentLimit: 20,
    recreateWhen: "always",
    flux: {
      managerFilePatterns: [
        "clusters/kind-cluster/**/*.yaml",
        "clusters/kind-cluster/**/*.yml",
      ],
      labels: ["dependencies", "flux"],
    },
    customManagers: [
      {
        customType: "regex",
        managerFilePatterns: [
          "/clusters/kind-cluster/flux/instance/flux-instance\\.yaml$/",
        ],
        matchStrings: [
          "version:\\s*\\\"(?<currentValue>[^\\\"\\s]+)\\\"",
        ],
        depNameTemplate: "fluxcd/flux2",
        datasourceTemplate: "github-releases",
        versioningTemplate: "npm",
      },
    ],
    packageRules: [
      {
        matchManagers: ["github-actions"],
        matchPackageNames: ["helm/kind-action"],
        allowedVersions: "<= 1.13.0"
      },
      {
        matchManagers: ["flux"],
        pinDigests: false,
      },
      {
        matchManagers: ["flux"],
        schedule: ["* 9,10,11,12,13,14,15,16,17 * * *"],
      },
      {
        matchManagers: ["custom.regex"],
        matchPackageNames: ["fluxcd/flux2"],
        matchFileNames: ["clusters/kind-cluster/flux/instance/flux-instance.yaml"],
        minimumReleaseAge: "2 days",
        matchUpdateTypes: ["major"],
        automerge: false,
        labels: ["dependencies", "flux", "kind"],
      },
      {
        matchManagers: ["flux"],
        matchFileNames: [
          "clusters/kind-cluster/**/*.yaml",
          "clusters/kind-cluster/**/*.yml",
          "clusters/veritable-prod/**/!*.yaml",
          "clusters/veritable-prod/**/!*.yml",
        ],
        postUpgradeTasks: {
          fileFilters: [
            "clusters/kind-cluster/**/*.yaml",
            "clusters/kind-cluster/**/*.yml"
          ]
        },
        separateMajorMinor: true,
        separateMultipleMajor: true,
        separateMinorPatch: false,
        groupName: null,
        automerge: true,
        addLabels: ["automerge", "kind"],
      },
      {
        matchManagers: ["flux"],
        matchFileNames: [
          "clusters/kind-cluster/**/*.yaml",
          "clusters/kind-cluster/**/*.yml",
          "clusters/veritable-prod/**/!*.yaml",
          "clusters/veritable-prod/**/!*.yml",
        ],
        postUpgradeTasks: {
          fileFilters: [
            "clusters/kind-cluster/**/*.yaml",
            "clusters/kind-cluster/**/*.yml"
          ]
        },
        matchUpdateTypes: ["major"],
        groupName: null,
        automerge: false,
        labels: ["dependencies", "flux", "kind"]
      },
      // Issue: These rules still merge YAML across directories into a single commit
      // TODO: Investigate how to force the separation of Renovate's PRs by directory
      // {
      //   matchManagers: ["flux"],
      //   matchFileNames: [
      //     "clusters/veritable-prod/**/*.yaml",
      //     "clusters/veritable-prod/**/*.yml",
      //     "clusters/kind-cluster/**/!*.yaml",
      //     "clusters/kind-cluster/**/!*.yml",
      //   ],
      //   postUpgradeTasks: {
      //     fileFilters: [
      //       "clusters/veritable-prod/**/*.yaml",
      //       "clusters/veritable-prod/**/*.yml"
      //     ]
      //   },
      //   separateMajorMinor: true,
      //   separateMultipleMajor: true,
      //   separateMinorPatch: false,
      //   groupName: null,
      //   automerge: false,
      //   addLabels: ["production"],
      // },
      {
        matchManagers: ["github-actions"],
        labels: ["dependencies", "github-actions"],
      },
      {
        matchManagers: ["github-actions"],
        matchUpdateTypes: ["major", "minor", "patch"],
        matchPackageNames: ["actions/checkout", "actions/cache"],
        automerge: true,
        extends: ["schedule:automergeNonOfficeHours"],
        addLabels: ["automerge"],
      },
    ],
  };
};
