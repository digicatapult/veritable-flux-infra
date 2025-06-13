# Creating New Clusters

## Quick start

### Prerequisites

- A Kubernetes cluster. It's recommended that you create new clusters using Terraform, using a method similar to the one used in the [veritable-terragrunt-infra](https://github.com/digicatapult/veritable-terragrunt-infra) repository.
- OpenSSL will be used to generate RSA keys.


### Install FluxCD onto your cluster

Check your current Kubernetes context and change if necessary:

```sh
kubectl config get-contexts
kubectl config set-context $CONTEXT
```

Install FluxCD locally and then onto the cluster, as specified by the above context:

```sh
brew install fluxcd/tap/flux
flux install
```

Generate an RSA key-pair. Ensure that it has "read access"; GitHub Deploy Keys are read-only by default.

```sh
openssl gen rsa -out id_rsa 4096
openssl rsa -in id_rsa -pubout -out id_rsa.pub
```

Install this key-pair onto your cluster and into your Git server so that we can pull from your repository.

This example uses GitHub:

```sh
kubectl create secret generic --type=Opaque \
--namespace=flux-system flux-system \
--from-file=identity=./id_rsa \
--from-file=identity.pub=./id_rsa.pub \
--from-literal=known_hosts=github.com ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSApQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==
```

Delete the local key-pair from your machine:

```sh
rm -rf id_rsa*
```


### Configuring FluxCD

Now that we have FluxCD installed with a working key-pair, we need to customise the repository for the new cluster to work with FluxCD's controllers.

Navigate to `flux/clusters/$CLUSTER_NAME/base/flux-system/` and edit `gotk-sync.yaml` with the following changes:

1. `GitRepository`
    - `spec.url`, the repository with SSH already configured
    - `spec.ref.branch`, the working branch (e.g. main at start)
2. `Kustomization`
    - `spec.path`, the relative parent directory of flux-system.

Once these changes have been made, commit and push them.

You will need to edit or remove the following kustomizations in `flux/clusters/$CLUSTER_NAME/base/`:

- app-sync.yaml; `spec.path` should match the cluster path
- secrets-sync.yaml; `spec.path` should match the cluster path
- namespaces.yaml; only change if adding or renaming namespaces

Once again, commit your changes and push them to your remote branch.

Now add the git source to the FluxCD instance on your cluster:

```sh
flux create source git --interval=1m \
--namespace=flux-system --secret-ref=flux-system \
--branch=$BRANCH_NAME \
--url=$REPOSITORY_URL flux-system
```

You should see that FluxCD successfully creates and reconciles the source. If it fails to do so, please check the [FluxCD documentation](https://fluxcd.io/docs/) and ensure you have successfully installed the RSA key as a secret on the cluster.

Assuming that the source has been reconciled, we now have to create the kustomization:

```sh
flux create kustomization --interval=10m \
--namespace=flux-system \
--path=$PATH_TO_FLUX_SYSTEM \
--prune --source=flux-system \
--validation=client flux-system
```

We should now have FluxCD pulling and applying its initial flux-system kustomization. Other kustomizations will fail due to a lack of secrets in their respective namespaces. We will rectify those errors via the steps below.


## Managing secrets

As mentioned in [Managing Secrets](./managing-secrets.md), we encrypt the secrets so that they can reside under version control but can only be decrypted by the cluster from within.


### PGP key creation

Run the following commands to generate a PGP key:

```sh
mktemp -d -t .sqnc-cluster-gpg

GNUPGHOME=.sqnc-cluster-gpg gpg \
--quick-gen-key --batch \
--passphrase '' --yes $CLUSTER_NAME
```

Export the public key as a certificate into the `./certs` directory:

```sh
mkdir certs/$CLUSTER_NAME

GNUPGHOME=.sqnc-cluster-gpg gpg \
--output certs/$CLUSTER_NAME/$CLUSTER_NAME.asc \
--export --armor $CLUSTER_NAME
```

Commit this and push it up to your branch.

Import the new key into the cluster:

```sh
GNUPGHOME=.sqnc-cluster-gpg gpg \
--export-secret-keys \
--armor $CLUSTER_NAME | \
kubectl create secret generic sops-gpg \
--namespace=flux-system \
--from-file=sops.asc=/dev/stdin
```

Verify that our imported key has the correct length:

```sh
kubectl describe secrets -n flux-system sops-gpg
```

```
Name:         sops-gpg
Namespace:    flux-system
Labels:       <none>
Annotations:  <none>

Type:  Opaque

Data
====
sops.asc:  5046 bytes
```

Delete the temporary directory used while creating the key:

```sh
rm -rf .sqnc-cluster-gpg
```
