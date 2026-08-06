include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "../../../terraform/modules/artifact-registry"
}

inputs = {
  project_id    = "mediflow-ai-enterprise"
  region        = "asia-south1"
  repository_id = "mediflow"
}
