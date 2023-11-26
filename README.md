## AWS Tomcat MySql Bastion Stack

Creates one stack: `vpc-stack` 

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


##
#### To Connect to Web Server with PuTTY:
First, convert the private key to putty format:
* Open the `devKeyPair.pem` file in PuTTYgen
* Save private key to `devKeyPair.ppk`
  
Then connect:
* Connection -> SSH -> Auth -> Credentials -> [Private key] -> Browse... -> `devKeyPair.ppk`
* Session -> Host name -> `ec2-user@<webServer.instancePublicDnsName>` -> Port -> `22`

##
#### To Connect to Database with MySQL Workbench:
* Connection Method: `Standard TCP/IP over SSH`
* SSH Hostname: `<bastionHostLinux.instancePublicDnsName>:22`
* SSH Username: `ec2-user`
* SSH Key File: `devKeyPair.pem`
* MySQL Hostname: `<cluster.clusterEndpoint.hostname>`
* MySQL Server Port: `<cluster.clusterEndpoint.port>`
* Username: `<admin user name>`
* Password: `<admin user password>`
