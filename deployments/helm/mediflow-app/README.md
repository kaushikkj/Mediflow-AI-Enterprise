# MediFlow Helm Chart

Deploys the MediFlow frontend and backend. PostgreSQL, Redis, object storage, and observability services are external dependencies and are not bundled into this application chart.

## Validate

```powershell
helm lint . -f values-local.yaml
helm template mediflow . -f values-local.yaml --namespace mediflow-dev
```

## Local Kubernetes installation

Build or load the images into your local Kubernetes runtime first, then run:

```powershell
helm upgrade --install mediflow . `
  --namespace mediflow-dev `
  --create-namespace `
  -f values-local.yaml `
  --set backend.image.tag=dev `
  --set frontend.image.tag=dev
```

Add these entries to the Windows hosts file when using an NGINX ingress controller:

```text
127.0.0.1 mediflow.local api.mediflow.local
```

## GKE development deployment

Do not commit real credentials. Create `mediflow-app-secrets` separately or sync it from Google Secret Manager.

```powershell
helm upgrade --install mediflow . `
  --namespace mediflow-dev `
  --create-namespace `
  -f values-gke-dev.yaml `
  --set backend.image.repository=asia-south1-docker.pkg.dev/PROJECT_ID/mediflow/backend `
  --set backend.image.tag=$env:GIT_SHA `
  --set frontend.image.repository=asia-south1-docker.pkg.dev/PROJECT_ID/mediflow/frontend `
  --set frontend.image.tag=$env:GIT_SHA
```

The frontend image must be built with the public backend URL because `VITE_API_URL` is compiled into the static frontend bundle.
