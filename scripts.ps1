param([ValidateSet("start","stop","status","logs","reset","test","observability")][string]$Action="start")
$compose = "compose.yaml"
switch ($Action) {
  "start" { podman compose -f $compose up -d --build }
  "stop" { podman compose -f $compose down }
  "status" { podman compose -f $compose ps -a }
  "logs" { podman compose -f $compose logs -f --tail=100 }
  "reset" { podman compose -f $compose down -v; podman compose -f $compose up -d --build }
  "test" { podman compose -f $compose exec backend pytest -q }
  "observability" { podman compose -f $compose --profile observability up -d }
}
