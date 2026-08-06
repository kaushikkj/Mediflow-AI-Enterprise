include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "../../terraform/modules/gke"
}

inputs = {
  project_id      = "mediflow-ai-enterprise"
  region          = "asia-south1"
  cluster_name    = "mediflow-gke"
  network         = "default"
  subnetwork      = "default"
  release_channel = "REGULAR"
}
