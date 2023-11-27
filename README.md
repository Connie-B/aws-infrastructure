## AWS Apache Tomcat MySql Bastion Stack

* Creates a VPC with public, private, and isolated subnets.
* Creates a EC2 Web Server in the public subnet.
* Creates a EC2 App Server in the private subnet.
* Creates a MySQL database cluster in the isolated subnet.
* Creates a Bastion host in the public subnet (connects with the other servers).

#### When the VPC Stack is deployed, UserData on the Web Server does: 
* Install Apache HTTP Server 

#### When the VPC Stack is deployed, UserData on the App Server does: 
* Install CodeDeploy Agent 
* Install Java
* Install Tomcat
