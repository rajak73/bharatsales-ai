#!/bin/bash
# Install Certbot and NGINX on Ubuntu EC2

echo "Installing NGINX and Certbot..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

echo "Copying NGINX configuration..."
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf

echo "Restarting NGINX..."
sudo systemctl restart nginx

# The domains below should be replaced with the actual client domains.
# To generate SSL certificates interactively:
echo "To generate SSL Certificates, run:"
echo "sudo certbot --nginx -d admin.yourdomain.com -d api.yourdomain.com"

echo "SSL setup scripts provisioned."
