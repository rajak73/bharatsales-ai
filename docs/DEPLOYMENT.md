# BharatSales AI - Deployment Guide

This guide explains how to deploy BharatSales AI to an AWS EC2 instance using GitHub Actions for Continuous Deployment (CD).

## 1. AWS EC2 Setup

1. **Launch an EC2 Instance:**
   - Go to the AWS Console -> EC2 -> Launch Instance.
   - Choose **Ubuntu 22.04 LTS**.
   - Choose an instance type (e.g., `t3.medium` or larger depending on traffic).
   - Create and download an **SSH Key Pair**. Keep this safe.
   - Configure the Security Group to allow inbound traffic on:
     - Port `22` (SSH)
     - Port `80` (HTTP - Web Dashboard)
     - Port `6002` (HTTP - Backend API)

2. **Provision the Instance:**
   - SSH into your new instance:
     ```bash
     ssh -i /path/to/key.pem ubuntu@<EC2_PUBLIC_IP>
     ```
   - Copy the setup script from the repo and run it to install Docker:
     ```bash
     wget https://raw.githubusercontent.com/<YOUR_GITHUB_ORG>/bharatsales-ai/main/infra/aws/setup.sh
     chmod +x setup.sh
     ./setup.sh
     ```
   - Log out and log back in to apply the `docker` user group.

## 2. GitHub Actions Secrets

Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.

Add the following secrets:

- `EC2_HOST`: The Public IP or DNS of your EC2 instance.
- `EC2_USERNAME`: Usually `ubuntu`.
- `EC2_SSH_KEY`: The entire contents of your downloaded `.pem` file (including the `-----BEGIN RSA PRIVATE KEY-----` lines).
- `MONGO_URI`: The connection string for your MongoDB Atlas cluster (or `mongodb://mongo:27017/bharatsales` if running locally on the instance).
- `JWT_SECRET`: A long random string for securing API tokens.
- `OPENAI_API_KEY`: Your OpenAI API key for the AI Assistant features.
- `NEXT_PUBLIC_API_URL`: The public URL of your API (e.g., `http://<EC2_PUBLIC_IP>:6002/api/v1`).

## 3. Trigger Deployment

1. The deployment pipeline is located in `.github/workflows/deploy.yml`.
2. Push your code to the `main` branch.
3. Go to the **Actions** tab in your GitHub repository to watch the deployment run.
4. Once completed, your web dashboard will be available at `http://<EC2_PUBLIC_IP>`.

## Troubleshooting

- **Containers keep restarting:** SSH into the server and run `docker ps -a`. Then run `docker logs <container_id>` to see the exact error. Usually, this means a missing environment variable or database connection failure.
- **Port 80 blocked:** Ensure your EC2 Security Group inbound rules allow HTTP traffic from `0.0.0.0/0`.
