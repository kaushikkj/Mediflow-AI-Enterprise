# Kubernetes and Helm — Phase 1

## Goal

Validate MediFlow on a local Kubernetes cluster before connecting deployments to GKE.
Every Git push runs CI and Helm validation only. GKE deployment remains manual.

## What the chart deploys

- Frontend Deployment and ClusterIP Service
- Backend Deployment and ClusterIP Service
- ConfigMap for non-sensitive backend configuration
- Kubernetes Secret or an externally created Secret
- Separate frontend and API ingress hosts
- Optional frontend and backend HPAs

PostgreSQL, Redis, object storage, and observability components remain external dependencies.

## Windows prerequisites

Install or verify:

```powershell
podman --version
kubectl version --client
helm version
kind version
```

## Validation commands

From the repository root:

```powershell
helm lint .\deployments\helm\mediflow-app `
  -f .\deployments\helm\mediflow-app\values-local.yaml
```

```powershell
helm template mediflow .\deployments\helm\mediflow-app `
  --namespace mediflow-dev `
  -f .\deployments\helm\mediflow-app\values-local.yaml `
  | Out-File -Encoding utf8 .\mediflow-rendered.yaml
```

```powershell
kubectl apply --dry-run=client -f .\mediflow-rendered.yaml
```

## Important image note

A local Kubernetes cluster cannot automatically see images stored only in Podman.
After creating the cluster, load the two local images into that cluster or push them to a registry.

The chart intentionally uses `dev` tags locally and Git commit SHA tags for GKE.
