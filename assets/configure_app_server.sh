#!/bin/bash -xe
# log files should be in /var/log/cloud-init-output.log
# exec 2>&1

echo "-xxxxxxxxxx Running app server configuration script xxxxxxxxxx-"

# Install OS packages
echo "-xxxxxxxxxx Installing OS packages"
sudo yum update -y
sudo yum install -y ruby
sudo yum install -y wget

# Install Code Deploy Agent
echo "-xxxxxxxxxx Installing CodeDeploy"
wget https://aws-codedeploy-us-east-1.s3.us-east-1.amazonaws.com/latest/install
chmod +x ./install
./install auto

# Install Java
echo "-xxxxxxxxxx Installing Java"
sudo yum install -y java-1.8*

# Download and Install Tomcat
echo "-xxxxxxxxxx Installing Tomcat"
cd /opt
wget https://archive.apache.org/dist/tomcat/tomcat-9/v9.0.80/bin/apache-tomcat-9.0.80.tar.gz
tar -zxvf apache-tomcat-9.0.80.tar.gz
mv apache-tomcat-9.0.80 tomcat


echo "-xxxxxxxxxx End of app server configuration script xxxxxxxxxx-"
