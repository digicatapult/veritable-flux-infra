# Getting Started

## Suspending/resuming FluxCD

FluxCD is used to manage services deployed in your clusters according to the [GitOps](https://about.gitlab.com/topics/gitops/) framework, effectively automating infrastructure management. It works by watching one or more paths in Git repositories that describe what should be deployed in the cluster. When YAML files within those paths are modified, the various FluxCD controllers on the cluster will attempt to reconcile those changes and keep the environment up-to-date. This eliminates much of the manual toil involved with infrastructure environments and can be even used to automate deployments to production.

There may be occasions where the automated reconciliation of the infrastructure would be disruptive for developers working on a change. To avoid this, we can suspend and resume the reconciliation of a Git repository via `flux suspend` and `flux resume`. Once suspended, FluxCD will stop tracking changes in the repository.

To view the current git repositories being synchronised:

```sh
$ flux get sources git
```

To suspend the reconciliation of `flux-system`:

```sh
flux suspend source git flux-system
```

Similar suspensions can be performed for other source types as well as for kustomizations.

To resume the reconciliation:

```sh
flux resume source git flux-system
```


## Dealing with unrecoverable Helm issues

During development you may find that Helm reconciliations fail and the issues do not resolve themselves even with countless retries. This is likely due to either issues with FluxCD itself, the Helm charts being deployed, or their values.

To see the status of all Helm releases:

```sh
flux get helmreleases -A
```

If a release is in an unrecoverable state, then it can be resolved by removing the release resource and then allowing the Kustomization which deploys the release to reconcile. For example, if the `keycloak` Helm release has erred you could run:

```sh
kubectl -n keycloak delete helmrelease keycloak
```

Because this specific Helm release is deployed by the `keycloak-sync` kustomization in the `flux-system` namespace, we can reconcile it again:

```sh
flux -n flux-system reconcile kustomization keycloak-sync
```


## Developing a new service component

When developing a new service component, you will need to ensure the following:

- The service must be containerised and deployable using Helm. This should be tested locally first using `helm install`.
- If a secret is required to pull the container image, e.g. from a private repository, then the secret resource must exist as a SOPs-encrypted secret in the respective cluster directory.

A new component will typically require at least one `HelmRepository` resource creating for it. These can be maintained in separate directories for convenience. For example:

```yaml
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: HelmRepository
metadata:
  name: demo-api
  namespace: demo
spec:
  type: "oci"
  interval: 10m
  url: oci://registry-1.docker.io/digicatapult
```

This instructs FluxCD that it should examine the URI for deployable OCI packages.

New components will typically also require the `HelmRelease` resource, describing the actual service to deploy:

```yaml
apiVersion: helm.toolkit.fluxcd.io/v2beta2
kind: HelmRelease
metadata:
  name: demo-api
  namespace: demo
spec:
  chart:
    spec:
      sourceRef:
        kind: HelmRepository
        name: demo-api
      chart: demo-api
      version: "0.0.5"
  valuesFrom:
    - kind: Secret
      name: demo-api-creds
      valuesKey: password
      targetPath: global.redis.password
  values:
    config:
      demo_queue_uri: kafka:9092
    kafka:
      enabled: false
    image:
      pullSecrets:
        - ghcr-cdecatapult
    ingress:
      annotations:
        kubernetes.io/ingress.class: nginx
        nginx.ingress.kubernetes.io/rewrite-target: /$2
      path: "/api(/|$)(.*)"
  interval: 10m0s
```

These resources may be defined in the same file or kept separate, e.g. with respective `release.yaml` and `values.yaml` files. You may also need one or more `ConfigMap` or SOPs-encrypted `Secret` resources in order for your service to deploy. This will depend on the specific configuration requirements of the service and these will need to be added individually for each cluster.

To test your changes, you will need to push them to a unique working branch and instruct the FluxCD instance installed on the cluster to synchronise from said branch. This should be done in two steps:

1. Modify the `spec.branch` field of the `flux-system/gotk-sync.yaml` file for the cluster in question. Match it to the branch that will have your changes and then push it along with any other changes you wish to make to the remote. Failing to change `gotk-sync.yaml` will prevent FluxCD from tracking the new state and it will instead continue to monitor the existing branch.
2. Update the FluxCD `GitRepository` resource to match the above branch. This is most easily done with the `flux` command line tool:

```sh
flux create source git flux-system \
--branch $BRANCH_NAME \
--namespace flux-system \
--url https://github.com/digicatapult/bridgeAI-gitops-infra.git
```

FluxCD will now reconcile the changes with the existing deployment. The `flux` command line tool can also be used to check the status of different resources, to suspend or resume reconciliation, and to force the synchronisation.

```sh
flux get kustomizations -A
```

```sh
flux resume kustomization keycloak-sync -n keycloak
```

```sh
flux reconcile helmrelease keycloak -n keycloak --force
```

After you have finished testing the change, revert the branch in `gotk-sync.yaml` to the default and push once again. This will cause FluxCD to track its original branch.
