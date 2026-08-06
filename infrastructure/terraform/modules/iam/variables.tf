variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "app_service_account_id" {
  description = "Service account ID used by MediFlow workloads."
  type        = string
}

variable "github_service_account_id" {
  description = "Service account ID used by GitHub Actions."
  type        = string
}
