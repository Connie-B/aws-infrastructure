#!/bin/bash -xe
# log files should be in /var/log/cloud-init-output.log
# exec 2>&1

echo "-xxxxxxxxxx Running web server configuration script xxxxxxxxxx-"

# Install OS packages
echo "-xxxxxxxxxx Installing OS packages"
sudo yum update -y
sudo yum install -y ruby
sudo yum install -y wget

# Install Apache HTTP Server
echo "-xxxxxxxxxx Installing Apache HTTP Server"
sudo yum install -y httpd
sudo yum install -y mod_ssl
sudo systemctl enable httpd
sudo systemctl start httpd


echo "-xxxxxxxxxx End of web server configuration script xxxxxxxxxx-"
