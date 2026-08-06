locals {
  secrets = toset([
    "mediflow-dev-jwt-secret",
    "mediflow-dev-minio-access-key",
    "mediflow-dev-minio-secret-key"
  ])
}

resource "google_secret_manager_secret" "this" {
  for_each = local.secrets

  project   = var.project_id
  secret_id = each.value

  labels = {
    application = "mediflow"
    environment = var.environment
    managed_by  = "terraform"
  }

  replication {
    auto {}
  }

  deletion_protection = true

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_secret_manager_secret_iam_member" "app_accessor" {
  for_each = google_secret_manager_secret.this

  project   = var.project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.app_service_account_email}"
}
