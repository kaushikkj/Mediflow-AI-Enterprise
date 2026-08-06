include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "../../../terraform/modules/network"
}

inputs = {
  project_id       = "mediflow-ai-enterprise"
  network_name     = "default"
  region           = "asia-south1"
  subnetwork_name  = "default"
  subnetwork_cidr  = "10.160.0.0/20"
  pods_range_name  = "gke-mediflow-gke-pods-c39ee3a3"
  pods_cidr        = "10.81.128.0/17"
}
