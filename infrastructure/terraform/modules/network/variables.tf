variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "network_name" {
  description = "Existing VPC network name."
  type        = string
}

variable "region" {
  description = "Region containing the subnet."
  type        = string
}

variable "subnetwork_name" {
  description = "Existing subnet name."
  type        = string
}

variable "subnetwork_cidr" {
  description = "Primary subnet IPv4 CIDR."
  type        = string
}

variable "pods_range_name" {
  description = "GKE Pods secondary range name."
  type        = string
}

variable "pods_cidr" {
  description = "GKE Pods secondary IPv4 CIDR."
  type        = string
}
