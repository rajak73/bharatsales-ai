#!/bin/bash
# AWS EC2 Setup Script for BharatSales AI
# Run this script on a fresh Ubuntu EC2 instance to install Docker and Docker Compose.

set -e

echo "🚀 Starting BharatSales AI EC2 Provisioning..."

# Update package lists
sudo apt-get update -y
sudo apt-get upgrade -y

# Install prerequisite packages
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Docker Compose
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-compose

# Add current user to the docker group so you don't need sudo
sudo usermod -aG docker $USER

echo "✅ Docker installed successfully."
echo "⚠️  IMPORTANT: Please log out and log back in for the Docker group changes to take effect."
echo "After logging back in, your instance will be ready to receive deployments via GitHub Actions!"
