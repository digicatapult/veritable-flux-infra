#!/usr/bin/env bash

set -euo pipefail

INFRA_GIT=https://github.com/digicatapult/veritable-flux-infra/
INFRA_BRANCH=main
CONTEXT_NAME=kind-veritable-flux-infra
INFRA_BASE_PATH=./clusters/kind-cluster/base


print_usage() {
  printf '%s\n' "Bootstraps Flux onto a cluster unless Flux is already managed by Flux Operator"
  printf '\nUsage:\n'
  printf '%s\n' "  ./scripts/install-flux.sh [ -h ] [ -g <git_repository> ] [ -b <base_branch> ] [ -c <kind_context_name> ] [ -p <base_path> ]"
  printf '\nOptions:\n'
  printf '%s\n' "  -g        Specify an alternative git repository. Note the default assumes http authentication"
  printf '%s\n' "            (default: https://github.com/digicatapult/veritable-flux-infra/)"
  printf '%s\n' "  -b        Specify an alternative base branch to use."
  printf '%s\n' "            (default: main)"
  printf '%s\n' "  -c        Specify the context name of your cluster"
  printf '%s\n' "            (default: kind-veritable-flux-infra)"
  printf '%s\n' "  -p        Specify an alternative base path"
  printf '%s\n' "            (default: ./clusters/kind-cluster/base)"
  printf '\nFlags:\n'
  printf '%s\n' "  -h        Prints this message"
}

while getopts ":g:b:c:p:h" opt; do
  case ${opt} in
    h )
      print_usage
      exit 0
      ;;
    g )
      INFRA_GIT=${OPTARG}
      ;;
    b )
      INFRA_BRANCH=${OPTARG}
      ;;
    c )
      CONTEXT_NAME=${OPTARG}
      ;;
    p )
      INFRA_BASE_PATH=${OPTARG}
      ;;
   \? )
      printf 'Invalid option: -%s\n\n' "$OPTARG" >&2
     print_usage
     exit 1
     ;;
  esac
done

assert_command() {
  local command="$1"

  printf "Checking for presence of %s..." "$command"
  local path_to_executable
  path_to_executable="$(command -v "$command")"

  if [[ -z "$path_to_executable" ]]; then
    printf "Cannot find %s executable. Is it on your \$PATH?\n" "$command"
    exit 1
  fi
  printf "OK\n"
}

assert_env() {
  local context="$1"

  printf "Checking for presence of context %s..." "$context"
  if ! kubectl cluster-info --context "$context" &> /dev/null; then
    printf "NOT OK\nError accessing kind cluster %s. Have you created the kind cluster?\n" "$context"
    exit 1
  fi
  printf "OK\nCluster %s exists\n" "$context"
}

assert_github_token() {
  printf "Checking for presence of GITHUB_TOKEN environment variable..."
  if [[ -z "${GITHUB_TOKEN:-}" ]]; then
    printf "NOT OK\nGitHub token environment variable is empty or not set. Please set a valid GITHUB_TOKEN environment variable.\n"
    exit 1
  fi
  printf "OK\n"
}

flux_instance_is_ready() {
  local context="$1"
  local ready

  if ! kubectl --context "$context" get fluxinstance flux --namespace flux-system &> /dev/null; then
    return 1
  fi

  ready="$(kubectl --context "$context" get fluxinstance flux --namespace flux-system \
    -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')"
  [[ "$ready" == "True" ]]
}

assert_flux_instance_state() {
  local context="$1"

  if ! kubectl --context "$context" get fluxinstance flux --namespace flux-system &> /dev/null; then
    return 0
  fi

  if flux_instance_is_ready "$context"; then
    printf "Flux is managed by ready FluxInstance/flux. Skipping conventional bootstrap.\n"
    exit 0
  fi

  printf "FluxInstance/flux exists but is not Ready. Resolve the migration before rerunning this script.\n" >&2
  exit 1
}

install_flux() {
  local context="$1"
  printf "Installing conventional Flux bootstrap...\n"
  flux install --context "$context" --timeout=3m
  printf "OK\nFlux successfully installed in %s\n" "$context"
}

setup_flux_git_source() {
  local context="$1"
  local repo="$2"
  local branch="$3"
  printf "Applying Git source from %s on branch %s in %s...\n" "$repo" "$branch" "$context"
  flux create source git --context="$context" --interval=1m --namespace=flux-system \
    --branch="$branch" --url="$repo" flux-system --export | kubectl --context "$context" apply -f -
  printf "OK\nGitRepository/flux-system applied in %s\n" "$context"
}

setup_flux_kustomization() {
  local context="$1"
  local path="$2"
  printf "Applying Kustomization from %s in %s...\n" "$path" "$context"
  flux create kustomization --context="$context" --interval=10m --namespace=flux-system \
    --path="$path" --prune --source=flux-system --validation=client flux-system --export | \
    kubectl --context "$context" apply -f -
  printf "OK\nKustomization/flux-system applied in %s\n" "$context"
}

assert_command kubectl
assert_command flux
assert_env "$CONTEXT_NAME"
assert_flux_instance_state "$CONTEXT_NAME"
assert_github_token
install_flux "$CONTEXT_NAME"
setup_flux_git_source "$CONTEXT_NAME" "$INFRA_GIT" "$INFRA_BRANCH"
setup_flux_kustomization "$CONTEXT_NAME" "$INFRA_BASE_PATH"
