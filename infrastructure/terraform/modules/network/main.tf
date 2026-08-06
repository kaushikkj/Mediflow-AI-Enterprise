resource "google_compute_network" "this" {
  project                 = var.project_id
  name                    = var.network_name
  description             = "Default network for the project"
  auto_create_subnetworks = true
  routing_mode            = "REGIONAL"

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_compute_subnetwork" "this" {
  project                  = var.project_id
  name                     = var.subnetwork_name
  region                   = var.region
  network                  = google_compute_network.this.id
  ip_cidr_range            = var.subnetwork_cidr
  private_ip_google_access = true
  stack_type               = "IPV4_ONLY"

  secondary_ip_range {
    range_name              = var.pods_range_name
    ip_cidr_range           = var.pods_cidr
    reserved_internal_range = "networkconnectivity.googleapis.com/projects/mediflow-ai-enterprise/locations/global/internalRanges/gke-mediflow-gke-pods-c39ee3a3"
  }

  lifecycle {
    prevent_destroy = true
  }
}
