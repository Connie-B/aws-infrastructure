## AWS Tomcat MySql Bastion Stack with Pipeline

Creates two stacks: `vpc-stack` and `pipeline-stack`

## VPC Stack
### `vpc-stack.ts`
* Creates a VPC with public, private, and isolated subnets.
* Creates a EC2 Web Server in the public subnet.
* Creates a MySQL database cluster in the isolated subnet.
* Creates a Bastion host in the public subnet (connects with MySQL database).

#### When the VPC Stack is deployed, UserData on the Web Server does: 
* Install CodeDeploy Agent 
* Install Java
* Install Tomcat

## Pipeline Stack
### `pipeline-stack.ts`
* Creates a Code Pipeline that runs when a GitHub repository is updated.

#### Pipeline is triggered when GitHub repository is updated: 
* Upload application source from GitHub to S3 bucket
* Build project according to buildspec.yml
* Deploy project according to appspec.yml

##
#### To Connect to Web Server with PuTTY:
First, convert the private key to putty format:
* Open the `awsKeyPair.pem` file in PuTTYgen
* Save private key to `awsKeyPair.ppk`
  
Then connect:
* Connection -> SSH -> Auth -> Credentials -> [Private key] -> Browse... -> `awsKeyPair.ppk`
* Session -> Host name -> `ec2-user@<webServer.instancePublicDnsName>` -> Port -> `22`

##
#### To Connect to Database with MySQL Workbench:
* Connection Method: `Standard TCP/IP over SSH`
* SSH Hostname: `<bastionHostLinux.instancePublicDnsName>:22`
* SSH Username: `ec2-user`
* SSH Key File: `awsKeyPair.pem`
* MySQL Hostname: `<cluster.clusterEndpoint.hostname>`
* MySQL Server Port: `<cluster.clusterEndpoint.port>`
* Username: `<admin user name>`
* Password: `<admin user password>`
