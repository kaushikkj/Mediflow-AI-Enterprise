variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "environment" {
  description = "Deployment environment."
  type        = string
}

variable "app_service_account_email" {
  description = "Google service account allowed to access the secrets."
  type        = string
}
