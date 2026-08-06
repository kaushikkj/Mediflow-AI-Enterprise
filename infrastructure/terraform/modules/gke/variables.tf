variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "region" {
  description = "GCP region containing the GKE cluster."
  type        = string
}

variable "cluster_name" {
  description = "Name of the GKE Autopilot cluster."
  type        = string
}

variable "network" {
  description = "VPC network used by the GKE cluster."
  type        = string
  default     = "default"
}

variable "subnetwork" {
  description = "VPC subnetwork used by the GKE cluster."
  type        = string
  default     = "default"
}

variable "release_channel" {
  description = "GKE release channel."
  type        = string
  default     = "REGULAR"
}
