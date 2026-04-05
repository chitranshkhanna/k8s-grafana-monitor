# Kubernetes Microservices Monitoring with Grafana + Jenkins CI/CD

Production-style observability and CI/CD pipeline using Node.js, Kubernetes, Prometheus, Grafana, and Jenkins.

## Architecture

- **App** — Node.js/Express exposing custom Prometheus metrics (`/metrics`)
- **Kubernetes** — Deployment, Service, HPA, ConfigMap, liveness + readiness probes
- **Prometheus** — Scrapes metrics every 15s via ServiceMonitor CRD
- **Grafana** — Dashboard with request rate, p50/p95/p99 latency, error rate, active users, pod count
- **Alerting** — PrometheusRule for high error rate, high latency, pod restarts
- **Jenkins** — CI/CD pipeline: install → test → build image → deploy to K8s → health check

## Tech stack

`Node.js` `Docker` `Kubernetes` `Helm` `Prometheus` `Grafana` `Jenkins` `HPA` `ServiceMonitor`

## Metrics exposed

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Requests by route/method/status |
| `http_request_duration_seconds` | Histogram | Latency — p50, p95, p99 |
| `http_errors_total` | Counter | 5xx errors by route |
| `active_users` | Gauge | Simulated active users |

## Run locally (Ubuntu + minikube)
```bash
bash scripts/setup.sh
# Terminal 1
kubectl port-forward -n monitoring svc/prometheus-grafana 3001:80
# Terminal 2
kubectl port-forward svc/monitor-app 8080:80
# Terminal 3 — generate traffic
bash scripts/load-test.sh
```

Grafana → http://localhost:3001 (admin / admin123)
Import `grafana/dashboard.json` to load the dashboard.

## Jenkins pipeline stages

1. Checkout code
2. Install npm dependencies
3. Run tests
4. Build Docker image inside minikube
5. Deploy manifests to Kubernetes
6. Apply ServiceMonitor + alert rules
7. Health check — pods + HPA status