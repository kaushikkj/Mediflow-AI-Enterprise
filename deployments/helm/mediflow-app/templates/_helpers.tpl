{{- define "mediflow-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "mediflow-app.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name (include "mediflow-app.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{- define "mediflow-app.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | quote }}
{{ include "mediflow-app.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: mediflow
{{- end }}

{{- define "mediflow-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mediflow-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "mediflow-app.backendName" -}}
{{ printf "%s-backend" (include "mediflow-app.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "mediflow-app.frontendName" -}}
{{ printf "%s-frontend" (include "mediflow-app.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "mediflow-app.configMapName" -}}
{{ printf "%s-config" (include "mediflow-app.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "mediflow-app.secretName" -}}
{{- default (printf "%s-secret" (include "mediflow-app.fullname" .)) .Values.secret.existingSecret | trunc 63 | trimSuffix "-" }}
{{- end }}
