# WellNexus Deployment Guide

**Version:** 2.0.0
**Last Updated:** 2025-11-21
**Target Audience:** DevOps Engineers, Backend Developers

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Frontend-Only Deployment (Current)](#phase-1-frontend-only-deployment-current)
3. [Phase 2: Full-Stack Deployment](#phase-2-full-stack-deployment)
4. [Environment Configuration](#environment-configuration)
5. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Disaster Recovery](#backup--disaster-recovery)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

WellNexus has two deployment phases:

- **Phase 1 (Current):** Frontend-only SPA deployed on Firebase Hosting
- **Phase 2 (Target):** Full-stack application with backend API, database, and cloud infrastructure

This guide covers both deployment scenarios.

---

## Phase 1: Frontend-Only Deployment (Current)

### Prerequisites

- Node.js 18+ and npm 9+
- Firebase account
- Firebase CLI installed globally

### 1.1 Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

### 1.2 Firebase Project Setup

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: `wellnexus-mvp`
4. Disable Google Analytics (optional for MVP)
5. Click "Create project"

#### Login to Firebase CLI

```bash
firebase login
```

This will open a browser for authentication.

### 1.3 Initialize Firebase Hosting

In your project root directory:

```bash
firebase init hosting
```

**Configuration Prompts:**

1. **Select project:** Choose "Use an existing project" → Select `wellnexus-mvp`
2. **Public directory:** Enter `dist` (Vite's output directory)
3. **Configure as single-page app:** Yes
4. **Set up automatic builds with GitHub:** No (we'll set up CI/CD separately)
5. **Overwrite index.html:** No

This creates:
- `.firebaserc` - Project configuration
- `firebase.json` - Hosting configuration

### 1.4 Configure Firebase Hosting

Edit `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "index.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      }
    ]
  }
}
```

### 1.5 Environment Variables Setup

Create `.env.production` file:

```bash
# .env.production
VITE_GEMINI_API_KEY=your_production_api_key_here
VITE_API_URL=https://api.wellnexus.vn/v1
VITE_ENVIRONMENT=production
```

**Important:** Never commit `.env.production` to version control!

Add to `.gitignore`:
```
.env.production
.env.local
```

### 1.6 Build & Deploy

#### Local Build

```bash
npm run build
```

This creates optimized production files in `dist/` directory.

#### Preview Build Locally

```bash
npm run preview
```

Access at `http://localhost:4173` to verify the production build.

#### Deploy to Firebase

```bash
firebase deploy --only hosting
```

**Output:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/wellnexus-mvp/overview
Hosting URL: https://wellnexus-mvp.web.app
```

Your application is now live at the provided Hosting URL!

### 1.7 Custom Domain Setup (Optional)

#### Add Custom Domain

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain: `wellnexus.vn`
4. Follow DNS configuration instructions
5. Add required DNS records to your domain registrar:
   - Type: `A`
   - Name: `@`
   - Value: Provided by Firebase
   - Type: `A`
   - Name: `www`
   - Value: Provided by Firebase

**SSL Certificate:**
Firebase automatically provisions SSL certificate (may take 24-48 hours).

### 1.8 Rollback Deployment

If you need to rollback to a previous version:

```bash
# List previous deployments
firebase hosting:releases:list

# Rollback to specific version
firebase hosting:rollback
```

---

## Phase 2: Full-Stack Deployment

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      INTERNET                            │
└─────────────────┬───────────────────────────────────────┘
                  │
         ┌────────┴────────┐
         │  CloudFront CDN │ (Frontend Assets)
         │  + SSL/TLS      │
         └────────┬────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───┴────────┐         ┌────────┴────────┐
│ S3 Bucket  │         │  Load Balancer  │
│ (Frontend) │         │   (ALB/NLB)     │
└────────────┘         └────────┬────────┘
                               │
                   ┌───────────┴──────────┐
                   │                      │
           ┌───────┴──────┐      ┌────────┴───────┐
           │  ECS Fargate │      │  ECS Fargate   │
           │  (Backend)   │      │  (Backend)     │
           │  Instance 1  │      │  Instance 2+   │
           └───────┬──────┘      └────────┬───────┘
                   │                      │
            ┌──────┴──────────────────────┴──────┐
            │                                    │
    ┌───────┴────────┐              ┌───────────┴────────┐
    │ RDS PostgreSQL │              │  ElastiCache Redis │
    │   (Multi-AZ)   │              │     (Cluster)      │
    └────────────────┘              └────────────────────┘
```

### 2.1 AWS Infrastructure Setup

#### Prerequisites

- AWS account with appropriate permissions
- AWS CLI installed and configured
- Docker installed
- Terraform or AWS CDK (optional but recommended)

#### Install AWS CLI

```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify
aws --version
```

#### Configure AWS CLI

```bash
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `ap-southeast-1` (Singapore - closest to Vietnam)
- Default output format: `json`

### 2.2 Database Setup (RDS PostgreSQL)

#### Create RDS PostgreSQL Instance

```bash
# Using AWS CLI
aws rds create-db-instance \
  --db-instance-identifier wellnexus-prod-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.9 \
  --master-username wellnexus_admin \
  --master-user-password 'SECURE_PASSWORD_HERE' \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name wellnexus-db-subnet \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --multi-az \
  --publicly-accessible false \
  --tags Key=Project,Value=WellNexus Key=Environment,Value=Production
```

**Important Parameters:**
- `multi-az`: Enables high availability across multiple availability zones
- `storage-encrypted`: Encrypts data at rest
- `publicly-accessible false`: Only accessible from within VPC

#### Create Database

Once RDS instance is available, connect and create database:

```bash
# Connect via psql (from bastion host or EC2 in same VPC)
psql -h wellnexus-prod-db.xxxxx.ap-southeast-1.rds.amazonaws.com \
     -U wellnexus_admin \
     -d postgres

# Create database
CREATE DATABASE wellnexus_production;

# Create application user (less privileged than admin)
CREATE USER wellnexus_app WITH PASSWORD 'APP_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE wellnexus_production TO wellnexus_app;
```

#### Database Migration

Using Prisma (or your chosen ORM):

```bash
# Set database URL
export DATABASE_URL="postgresql://wellnexus_app:APP_PASSWORD@wellnexus-prod-db.xxxxx.ap-southeast-1.rds.amazonaws.com:5432/wellnexus_production?schema=public"

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

### 2.3 Redis Cache Setup (ElastiCache)

#### Create Redis Cluster

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id wellnexus-prod-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name wellnexus-cache-subnet \
  --security-group-ids sg-xxxxxxxxx \
  --tags Key=Project,Value=WellNexus Key=Environment,Value=Production
```

**Note:** For production with high availability, use Redis Replication Group with automatic failover.

### 2.4 Backend Deployment (Docker + ECS Fargate)

#### Dockerfile for Backend

Create `backend/Dockerfile`:

```dockerfile
# Multi-stage build for optimized image size

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Build application
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/main.js"]
```

#### Build and Push Docker Image to ECR

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name wellnexus/backend \
  --region ap-southeast-1

# Login to ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS \
  --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com

# Build image
cd backend
docker build -t wellnexus-backend:latest .

# Tag image
docker tag wellnexus-backend:latest \
  <AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/wellnexus/backend:latest

# Push to ECR
docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/wellnexus/backend:latest
```

#### Create ECS Task Definition

Create `task-definition.json`:

```json
{
  "family": "wellnexus-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<AWS_ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<AWS_ACCOUNT_ID>:role/wellnexusBackendTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/wellnexus/backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:<AWS_ACCOUNT_ID>:secret:wellnexus/database-url"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:<AWS_ACCOUNT_ID>:secret:wellnexus/redis-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:<AWS_ACCOUNT_ID>:secret:wellnexus/jwt-secret"
        },
        {
          "name": "GEMINI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:<AWS_ACCOUNT_ID>:secret:wellnexus/gemini-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/wellnexus-backend",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register task definition:

```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json
```

#### Create ECS Service

```bash
aws ecs create-service \
  --cluster wellnexus-cluster \
  --service-name wellnexus-backend-service \
  --task-definition wellnexus-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:ap-southeast-1:<AWS_ACCOUNT_ID>:targetgroup/wellnexus-backend-tg/xxx,containerName=backend,containerPort=3000" \
  --health-check-grace-period-seconds 60 \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100,deploymentCircuitBreaker={enable=true,rollback=true}" \
  --enable-execute-command
```

### 2.5 Frontend Deployment (S3 + CloudFront)

#### Create S3 Bucket for Frontend

```bash
aws s3 mb s3://wellnexus-frontend-prod --region ap-southeast-1

# Enable versioning for rollback capability
aws s3api put-bucket-versioning \
  --bucket wellnexus-frontend-prod \
  --versioning-configuration Status=Enabled

# Block public access (CloudFront will serve content)
aws s3api put-public-access-block \
  --bucket wellnexus-frontend-prod \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

#### Build Frontend with Production API URL

Update `.env.production`:

```bash
VITE_API_URL=https://api.wellnexus.vn/v1
VITE_ENVIRONMENT=production
```

Build:

```bash
npm run build
```

#### Upload to S3

```bash
aws s3 sync dist/ s3://wellnexus-frontend-prod/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Upload index.html with no-cache (for SPA routing)
aws s3 cp dist/index.html s3://wellnexus-frontend-prod/index.html \
  --cache-control "no-cache, no-store, must-revalidate"
```

#### Create CloudFront Distribution

Create `cloudfront-config.json`:

```json
{
  "CallerReference": "wellnexus-frontend-2025",
  "Comment": "WellNexus Frontend Distribution",
  "Enabled": true,
  "Origins": [
    {
      "Id": "S3-wellnexus-frontend-prod",
      "DomainName": "wellnexus-frontend-prod.s3.ap-southeast-1.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": "origin-access-identity/cloudfront/<OAI_ID>"
      }
    }
  ],
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-wellnexus-frontend-prod",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
    "CachedMethods": ["GET", "HEAD"],
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "CustomErrorResponses": [
    {
      "ErrorCode": 403,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 300
    },
    {
      "ErrorCode": 404,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 300
    }
  ],
  "Aliases": ["wellnexus.vn", "www.wellnexus.vn"],
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:us-east-1:<AWS_ACCOUNT_ID>:certificate/<CERT_ID>",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "PriceClass": "PriceClass_All"
}
```

Create distribution:

```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

### 2.6 Load Balancer Setup

#### Create Application Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name wellnexus-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --tags Key=Project,Value=WellNexus Key=Environment,Value=Production
```

#### Create Target Group

```bash
aws elbv2 create-target-group \
  --name wellnexus-backend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-enabled \
  --health-check-protocol HTTP \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3
```

#### Create Listener

```bash
# HTTPS Listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:ap-southeast-1:<AWS_ACCOUNT_ID>:loadbalancer/app/wellnexus-alb/xxx \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:ap-southeast-1:<AWS_ACCOUNT_ID>:certificate/<CERT_ID> \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:ap-southeast-1:<AWS_ACCOUNT_ID>:targetgroup/wellnexus-backend-tg/xxx

# HTTP Listener (redirect to HTTPS)
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:ap-southeast-1:<AWS_ACCOUNT_ID>:loadbalancer/app/wellnexus-alb/xxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}
```

### 2.7 DNS Configuration

#### Route 53 Setup

```bash
# Create hosted zone (if not exists)
aws route53 create-hosted-zone \
  --name wellnexus.vn \
  --caller-reference wellnexus-2025

# Create A record for API (points to ALB)
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.wellnexus.vn",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "<ALB_HOSTED_ZONE_ID>",
          "DNSName": "<ALB_DNS_NAME>",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'

# Create A record for frontend (points to CloudFront)
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "wellnexus.vn",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "<CLOUDFRONT_DOMAIN>",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

---

## Environment Configuration

### Backend Environment Variables

Create in AWS Secrets Manager:

```bash
# Database URL
aws secretsmanager create-secret \
  --name wellnexus/database-url \
  --secret-string "postgresql://wellnexus_app:PASSWORD@wellnexus-prod-db.xxxxx.ap-southeast-1.rds.amazonaws.com:5432/wellnexus_production"

# Redis URL
aws secretsmanager create-secret \
  --name wellnexus/redis-url \
  --secret-string "redis://wellnexus-prod-redis.xxxxx.cache.amazonaws.com:6379"

# JWT Secret
aws secretsmanager create-secret \
  --name wellnexus/jwt-secret \
  --secret-string "$(openssl rand -base64 64)"

# Gemini API Key
aws secretsmanager create-secret \
  --name wellnexus/gemini-api-key \
  --secret-string "YOUR_GEMINI_API_KEY"

# Encryption Key
aws secretsmanager create-secret \
  --name wellnexus/encryption-key \
  --secret-string "$(openssl rand -base64 32)"
```

### Frontend Environment Variables

In `.env.production`:

```bash
VITE_API_URL=https://api.wellnexus.vn/v1
VITE_ENVIRONMENT=production
VITE_APP_VERSION=2.0.0
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## CI/CD Pipeline Setup

### Current Implementation (2026-02-02)

WellNexus uses **GitHub Actions** + **Vercel Git Integration** for automated CI/CD:

#### Active Workflows

**1. CI Pipeline** (`.github/workflows/ci.yml`)
- Triggers: Push to main, Pull Requests
- Status: ✅ Passing (1m25s average)
- Steps:
  - Checkout code
  - Setup Node.js 20.x with npm cache
  - Install dependencies (`npm ci`)
  - **Security audit** (`npm audit --audit-level=high`)
  - Run linter (`npm run lint`)
  - Run tests (`npm test`)
  - Build project (`npm run build`)
  - Upload build artifacts (7-day retention)

**2. Lighthouse CI** (`.github/workflows/lighthouse.yml`)
- Triggers: Pull Requests only
- Purpose: Performance auditing
- Thresholds:
  - Performance: 80%
  - Accessibility: 90%
  - Best Practices: 90%
  - SEO: 90%

**3. Vercel Auto-Deploy**
- Platform: Vercel
- Production URL: https://wellnexus.vn
- Triggers: Every push to main branch
- Build time: ~10 minutes (includes CDN warming)
- Features:
  - Automatic preview deployments for PRs
  - CDN caching (HIT rate ~95%)
  - HTTPS/HTTP2 enabled
  - Security headers (HSTS, CSP, X-Frame-Options)

#### Security Scanning

**npm audit** - High severity vulnerabilities check
- Runs on every CI build
- Command: `npm audit --audit-level=high || true`
- Non-blocking (continues on warnings)

**Note:** CodeQL (GitHub Advanced Security) is disabled for private repositories. Use npm audit for basic dependency scanning.

#### View Workflow Runs

https://github.com/longtho638-jpg/Well/actions

---

### Legacy Reference: Full-Stack Deployment (Future)

Below is the original AWS ECS deployment plan for Phase 2 (backend + infrastructure):

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
    tags:
      - 'v*'

env:
  AWS_REGION: ap-southeast-1
  ECR_REPOSITORY: wellnexus/backend
  ECS_SERVICE: wellnexus-backend-service
  ECS_CLUSTER: wellnexus-cluster
  ECS_TASK_DEFINITION: task-definition.json
  CONTAINER_NAME: backend

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: ${{ env.ECS_TASK_DEFINITION }}
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ steps.build-image.outputs.image }}

      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build frontend
        env:
          VITE_API_URL: https://api.wellnexus.vn/v1
          VITE_ENVIRONMENT: production
        run: npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://wellnexus-frontend-prod/ \
            --delete \
            --cache-control "public, max-age=31536000, immutable" \
            --exclude "index.html"

          aws s3 cp dist/index.html s3://wellnexus-frontend-prod/index.html \
            --cache-control "no-cache, no-store, must-revalidate"

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Frontend deployment completed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### Required GitHub Secrets

Add these secrets to your GitHub repository:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `SLACK_WEBHOOK` (optional)

---

## Monitoring & Logging

### CloudWatch Logs Setup

```bash
# Create log group for ECS tasks
aws logs create-log-group \
  --log-group-name /ecs/wellnexus-backend \
  --retention-in-days 30

# Create metric filters for errors
aws logs put-metric-filter \
  --log-group-name /ecs/wellnexus-backend \
  --filter-name ErrorCount \
  --filter-pattern "[timestamp, request_id, level=ERROR, ...]" \
  --metric-transformations \
    metricName=ErrorCount,metricNamespace=WellNexus,metricValue=1
```

### CloudWatch Alarms

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name wellnexus-high-error-rate \
  --alarm-description "Alert when error rate exceeds threshold" \
  --metric-name ErrorCount \
  --namespace WellNexus \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:ap-southeast-1:<AWS_ACCOUNT_ID>:wellnexus-alerts

# High CPU usage alarm
aws cloudwatch put-metric-alarm \
  --alarm-name wellnexus-high-cpu \
  --alarm-description "Alert when CPU usage exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=wellnexus-backend-service Name=ClusterName,Value=wellnexus-cluster \
  --alarm-actions arn:aws:sns:ap-southeast-1:<AWS_ACCOUNT_ID>:wellnexus-alerts
```

### Application Performance Monitoring (APM)

#### Sentry Integration

**Install Sentry SDK:**

```bash
npm install @sentry/node @sentry/integrations
```

**Configure in backend:**

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of requests
});
```

---

## Backup & Disaster Recovery

### Database Backups

**Automated RDS Backups:**
- Configured during RDS setup with 7-day retention
- Daily backups at 03:00 UTC

**Manual Backup:**

```bash
aws rds create-db-snapshot \
  --db-instance-identifier wellnexus-prod-db \
  --db-snapshot-identifier wellnexus-manual-backup-$(date +%Y%m%d)
```

**Restore from Backup:**

```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier wellnexus-restored-db \
  --db-snapshot-identifier wellnexus-manual-backup-20251121
```

### S3 Bucket Versioning

Already enabled for frontend bucket. To restore previous version:

```bash
# List versions
aws s3api list-object-versions \
  --bucket wellnexus-frontend-prod \
  --prefix index.html

# Restore specific version
aws s3api copy-object \
  --bucket wellnexus-frontend-prod \
  --copy-source wellnexus-frontend-prod/index.html?versionId=<VERSION_ID> \
  --key index.html
```

---

## Security Best Practices

### 1. Network Security

- Use VPC with private subnets for RDS and Redis
- Use security groups with least-privilege rules
- Enable VPC Flow Logs for audit trail

### 2. Secrets Management

- Store all secrets in AWS Secrets Manager
- Rotate secrets regularly (30-90 days)
- Use IAM roles instead of access keys where possible

### 3. Encryption

- Enable encryption at rest for:
  - RDS database
  - S3 buckets
  - EBS volumes
- Enable encryption in transit:
  - HTTPS only (enforce via CloudFront and ALB)
  - TLS 1.2 minimum

### 4. Access Control

- Use IAM roles with least-privilege policies
- Enable MFA for AWS root account
- Use separate AWS accounts for dev/staging/prod

### 5. Monitoring & Auditing

- Enable CloudTrail for API audit logging
- Set up GuardDuty for threat detection
- Configure AWS Config for compliance monitoring

---

## Troubleshooting

### Issue: ECS Tasks Keep Failing

**Symptoms:** Tasks start but immediately exit with errors

**Solutions:**
1. Check CloudWatch Logs:
   ```bash
   aws logs tail /ecs/wellnexus-backend --follow
   ```
2. Verify environment variables and secrets are correct
3. Check task execution role has permissions to pull ECR image and read secrets
4. Verify health check endpoint is responding

### Issue: Frontend Shows Old Version

**Symptoms:** Users see cached old version after deployment

**Solutions:**
1. Invalidate CloudFront cache:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id <DIST_ID> \
     --paths "/*"
   ```
2. Verify S3 sync completed successfully
3. Check browser cache (hard refresh: Ctrl+Shift+R)

### Issue: Database Connection Timeouts

**Symptoms:** Backend cannot connect to RDS

**Solutions:**
1. Verify security group allows inbound traffic from ECS tasks
2. Check VPC configuration and subnets
3. Verify database credentials in Secrets Manager
4. Check RDS instance status

### Issue: High Latency

**Symptoms:** API responses are slow

**Solutions:**
1. Enable RDS Performance Insights
2. Check for missing database indexes
3. Review CloudWatch metrics for resource bottlenecks
4. Consider enabling Redis caching
5. Scale up ECS task count or instance size

---

## Post-Deployment Checklist

- [ ] Verify frontend loads at https://wellnexus.vn
- [ ] Verify API responds at https://api.wellnexus.vn/v1/health
- [ ] Test user registration flow
- [ ] Test product purchase flow
- [ ] Verify email notifications work
- [ ] Check CloudWatch alarms are active
- [ ] Verify database backups are running
- [ ] Test rollback procedure
- [ ] Update DNS TTL to normal values (after testing)
- [ ] Document deployment in runbook
- [ ] Notify team of deployment completion

---

## Rollback Procedures

### Frontend Rollback

```bash
# Find previous version ID
aws s3api list-object-versions \
  --bucket wellnexus-frontend-prod

# Restore previous version
aws s3api copy-object \
  --bucket wellnexus-frontend-prod \
  --copy-source wellnexus-frontend-prod/index.html?versionId=<PREVIOUS_VERSION> \
  --key index.html

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id <DIST_ID> \
  --paths "/*"
```

### Backend Rollback

```bash
# Update ECS service to previous task definition
aws ecs update-service \
  --cluster wellnexus-cluster \
  --service wellnexus-backend-service \
  --task-definition wellnexus-backend:<PREVIOUS_REVISION>
```

---

**Document Version:** 2.0.0
**Last Updated:** 2025-11-21
**Maintained By:** WellNexus DevOps Team

For questions or issues, contact: devops@wellnexus.vn
