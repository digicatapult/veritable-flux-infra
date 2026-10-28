# Repository structure

This repository has the following structure:

```
├── clusters
│   └── kind-cluster
│       ├── base
│       ├── persona  # alice, bob, and charlie
│       │   ├── veritable-cloudagent
│       │   │   └── cluster
│       │   └── veritable-ui  # alice only
│       │       └── cluster
│       ├── cert-manager
│       ├── cloudnative-pg
│       ├── flux
│       │   ├── instance
│       │   └── operator
│       ├── keycloak
│       │   └── cluster
│       ├── monitoring
│       │   ├── alloy
│       │   ├── kube-prometheus-stack
│       │   └── loki
│       ├── nginx
│       └── traefik
├── docs
└── scripts
```


## Certs

The `certs` directory contains the public PGP certificates (keys) used to encrypt new secrets, i.e. as organised by the environments in which the corresponding private keys are deployed. It is created per cluster when needed; see [Creating New Clusters](./creating-new-clusters.md).


## Clusters

This directory contains cluster-specific configuration details and deployment "kustomizations". These are broken down by environment. `kind-cluster` is the reference implementation for local development and for any future deployments. See [Getting Started](./getting-started.md) to run it locally and [Creating New Clusters](./creating-new-clusters.md) to add a new environment.


### Base

The `base` directory contains the namespaces, sources, and Flux kustomizations that install and synchronise applications from kustomizations residing elsewhere in the cluster directory.


### Flux

The `flux` directory installs the Flux Operator (`operator`) and the `FluxInstance` (`instance`) that manages the Flux controllers. See [Migrating to the Flux Operator](./migrating-to-flux-operator.md).


### Platform services

- `cert-manager` issues TLS certificates.
- `cloudnative-pg` provides the PostgreSQL operator used by Veritable and Keycloak.
- `keycloak` provides identity and access management.
- `nginx` and `traefik` provide ingress. Choose one. Traefik is the more recent.
- `monitoring` deploys the observability stack: `kube-prometheus-stack` (Prometheus and Grafana), `loki` (logs), and `alloy` (telemetry collection).


### Personas

Each persona directory, e.g. `alice` and `bob`, contains the Veritable cloudagent configuration (and, for `alice`, the UI), typically in the form of distinct YAML files for the kustomization, release (e.g. HelmRelease), and values, plus a `cluster` directory for the persona's PostgreSQL database.


### Secrets

Clusters that need them keep SOPS-encrypted secrets in a `secrets` directory, which are loaded into the cluster and decrypted from within it. The kind cluster does not currently use one. See [Managing Secrets](./managing-secrets.md) for instructions on how to create new secrets for an environment.


## Docs

This folder contains documentation for the repository.


## Scripts

Within `scripts`, there are several that can be used to respectively initialise a Kind cluster, install FluxCD to it, and encrypt secrets for use by any given cluster.
