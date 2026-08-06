locals {
  project_id = "mediflow-ai-enterprise"
  region     = "asia-south1"
}

remote_state {
  backend = "gcs"

  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }

  config = {
    project  = local.project_id
    bucket   = "mediflow-tfstate-60743144906"
    location = local.region
    prefix   = "${path_relative_to_include()}/terraform.tfstate"
  }
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"

  contents = <<EOF
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
  }
}

provider "google" {
  project = "${local.project_id}"
  region  = "${local.region}"
}
EOF
}
