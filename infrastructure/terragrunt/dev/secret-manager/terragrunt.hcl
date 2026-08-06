include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "../../../terraform/modules/secret-manager"
}

inputs = {
  project_id                = "mediflow-ai-enterprise"
  environment               = "dev"
  app_service_account_email = "mediflow-app-dev@mediflow-ai-enterprise.iam.gserviceaccount.com"
}
