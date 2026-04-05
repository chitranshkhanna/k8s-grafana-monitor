# Kubernetes Microservices Monitoring with Grafana

A production-style observability setup using Node.js, Kubernetes, Prometheus, and Grafana.

## Architecture

- **App**: Node.js/Express with custom Prometheus metrics
- **Kubernetes**: Deployment, Service, HPA, ConfigMap, liveness/readiness probes
- **Prometheus**: Scrapes /metrics every 15s via ServiceMonitor
- **Grafana**: Dashboards for request rate, p95/p99 latency, error rate, active users
- **Alerting**: Rules for high error rate, high latency, pod restarts

## Stack

`Node.js` `Docker` `Kubernetes` `Prometheus` `Grafana` `Helm`

## Run it
```bash
# Inside Ubuntu VM
bash scripts/setup.sh

# Port-forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3001:80

# Port-forward app
kubectl port-forward svc/monitor-app 8080:80

# Generate traffic
bash scripts/load-test.sh
```

Grafana → http://localhost:3001 (admin / admin123)
Import `grafana/dashboard.json` to see the dashboard.

## Metrics exposed

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total requests by route/status |
| `http_request_duration_seconds` | Histogram | Latency with p50/p95/p99 |
| `http_errors_total` | Counter | 5xx errors by route |
| `active_users` | Gauge | Simulated active users |