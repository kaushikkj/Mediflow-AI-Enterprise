resource "google_service_account" "app" {
  project      = var.project_id
  account_id   = var.app_service_account_id
  display_name = "MediFlow Dev Application"
  description  = "Identity used by MediFlow application workloads in the development GKE cluster."

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_service_account" "github_deployer" {
  project      = var.project_id
  account_id   = var.github_service_account_id
  display_name = "MediFlow GitHub Deployer"
  description  = "Identity used by GitHub Actions through Workload Identity Federation."

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_service_account_iam_member" "app_workload_identity" {
  service_account_id = google_service_account.app.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[mediflow-dev/mediflow-backend]"
}
