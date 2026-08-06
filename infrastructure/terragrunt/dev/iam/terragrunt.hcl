include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "../../../terraform/modules/iam"
}

inputs = {
  project_id                = "mediflow-ai-enterprise"
  app_service_account_id    = "mediflow-app-dev"
  github_service_account_id = "mediflow-github-deployer"
}
