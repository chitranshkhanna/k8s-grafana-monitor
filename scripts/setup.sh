#!/bin/bash
set -e

echo "==> Starting minikube..."
minikube start --driver=docker --memory=3800 --cpus=2

echo "==> Enabling metrics-server addon..."
minikube addons enable metrics-server

echo "==> Building Docker image inside minikube..."
eval $(minikube docker-env)
docker build -t monitor-app:1.0 ./app

echo "==> Applying Kubernetes manifests..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml

echo "==> Waiting for pods to be ready..."
kubectl rollout status deployment/monitor-app --timeout=120s

echo "==> Adding Helm repos..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

echo "==> Installing kube-prometheus-stack..."
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword=admin123 \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
  --wait --timeout=5m

echo "==> Applying ServiceMonitor and alert rules..."
kubectl apply -f k8s/servicemonitor.yaml
kubectl apply -f prometheus/alert-rules.yaml

echo ""
echo "==> All done! Run these in two separate terminals:"
echo ""
echo "  Terminal 1:  kubectl port-forward -n monitoring svc/prometheus-grafana 3001:80"
echo "  Terminal 2:  kubectl port-forward svc/monitor-app 8080:80"
echo ""
echo "  Grafana →  http://localhost:3001   (admin / admin123)"
echo "  App     →  http://localhost:8080"