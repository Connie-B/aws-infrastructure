import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Peer, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';

import { VpcBuilder } from './vpc-builder'
import { WebInstanceBuilder as WebInstanceBuilder } from './web-instance-builder'
import { AppInstanceBuilder as AppInstanceBuilder } from './app-instance-builder'
import { BastionHostLinuxBuilder } from './bastion-host-linux-builder'
import { DatabaseClusterBuilder } from './database-cluster-builder'

export class VpcStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // environment specific variables
    const envPrefix = 'dev';
    const appServerKeyName = 'devKeyPair';
    const webServerKeyName = 'devKeyPair';
    const bastionServerKeyName = 'devKeyPair';
    const dbUsername = 'admin';
    const dbCredsSecretName = 'mysql-token';


    // create VPC
    const vpc = VpcBuilder.buildVpc(this, `${envPrefix}-Vpc`);
    // Create flowlog and log the vpc traffic into cloudwatch
    vpc.addFlowLog(`${envPrefix}-VpcFlowLog`);


    // Create security group for bastion host
    const bastionSecurityGroup = new SecurityGroup(this, `${envPrefix}-Bastion-SecurityGroup`, {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'Security group for bastion host',
      securityGroupName: 'BastionSecurityGroup'
      });
      // Allow ssh access to bastion host
      bastionSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(22), 'SSH access');
    // create bastion host
    const bastionHostLinux = BastionHostLinuxBuilder.buildBastionHost(this, `${envPrefix}-Bastion`, {
      vpc: vpc,
      keyName: bastionServerKeyName,
      securityGroup: bastionSecurityGroup
    });


    // Create SecurityGroup for the Web server
    const webServerSecurityGroup = new SecurityGroup(this, `${id}-WebServerSecurityGroup`,{
      vpc: vpc,
      allowAllOutbound: true,
      description: 'Allows Inbound HTTP traffic to the web server.',
      securityGroupName: 'WebSecurityGroup'
    });
    webServerSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'Allow HTTP access'
    );
    webServerSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'Allow HTTPS access'
    );
    webServerSecurityGroup.addIngressRule(
      bastionSecurityGroup,
      Port.tcp(22),
      'Allow SSH access from bastion host'
    );
    // create web server instance
    const webServer = WebInstanceBuilder.buildInstance(this, `${envPrefix}-WebServer`, {
      vpc: vpc, 
      keyName: webServerKeyName,
      securityGroup: webServerSecurityGroup
    });
    // webServer depends on bastionHostLinux
    webServer.node.addDependency(bastionHostLinux)


    // Create SecurityGroup for the App server
    const appServerSecurityGroup = new SecurityGroup(this, `${id}-AppServerSecurityGroup`,{
      vpc: vpc,
      allowAllOutbound: true,
      description: 'Allows Inbound HTTP traffic to the app server.',
      securityGroupName: 'AppServerSecurityGroup'
    });
    appServerSecurityGroup.addIngressRule(
      webServerSecurityGroup,
      Port.tcp(8009),
      'Allow access from web server'
    );
    appServerSecurityGroup.addIngressRule(
      bastionSecurityGroup,
      Port.tcp(22),
      'Allow access from bastion host'
    );
    // create application server instance
    const appServer = AppInstanceBuilder.buildInstance(this, `${envPrefix}-AppServer`, {
      vpc: vpc, 
      keyName: appServerKeyName,
      securityGroup: appServerSecurityGroup
    });
    // appServer depends on bastionHostLinux
    appServer.node.addDependency(bastionHostLinux)


    // Create security group for RDS cluster
    const rdsClusterSecurityGroup = new SecurityGroup(this, `${envPrefix}-Database-SecurityGroup`, {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'Security group for RDS cluster',
      securityGroupName: 'RDSClusterSecurityGroup'
    });
    // create RDS database cluster
    const cluster = DatabaseClusterBuilder.buildDatabaseCluster(this, `${envPrefix}-Database`, {
      vpc: vpc,
      securityGroup: rdsClusterSecurityGroup,
      username: dbUsername,
      credsSecretName: dbCredsSecretName,
      databasename: `${envPrefix}database`.toLowerCase()
    });
    cluster.connections.allowDefaultPortFrom(bastionSecurityGroup, 'Allow access from bastion host');
    cluster.connections.allowDefaultPortFrom(appServerSecurityGroup, 'Allow access from App server');


    // Output the details we need to connect to the servers
    
    // Output the public IP address of the Web Server instance
    new CfnOutput(this, "Web Server IP Address", {
      value: webServer.instancePublicIp
    });
    // Output the private IP address of the Web Server instance
    new CfnOutput(this, "Web Server Private IP Address", {
      value: webServer.instancePrivateIp
    });

    // Output the private IP address of the App Server instance
    new CfnOutput(this, "App Server Private IP Address", {
      value: appServer.instancePrivateIp
    });

    // Output the DNS Name of the Bastion host
    new CfnOutput(this, "Bastion Host DNS Name", { 
      value: bastionHostLinux.instancePublicDnsName 
    });

	  // Exported attributes can be accessed later from another stack in the same AWS account and region

    // Export the VPC ID
    new CfnOutput(this, 'VPC ID', {
      exportName: `${envPrefix}-vpc-id`,
      value: vpc.vpcId
    })

    // Output the ID of the Web Server Instance
    new CfnOutput(this, "Web Server Instance ID", {
      exportName: `${envPrefix}-web-server-instance-id`,
      value: webServer.instanceId
    });
    
    // Output the ID of the App Server Instance
    new CfnOutput(this, "App Server Instance ID", {
      exportName: `${envPrefix}-app-server-instance-id`,
      value: appServer.instanceId
    });

    // Export the Identifier of the DB Cluster
    new CfnOutput(this, 'DB Cluster Identifier', {
      exportName: `${envPrefix}-db-cluster-id`,
      value: cluster.clusterIdentifier
    });
    
    // Export the Hostname of the DB Cluster Endpoint
	  new CfnOutput(this, 'DB Cluster Endpoint Hostname', {
      exportName: `${envPrefix}-db-cluster-endpoint-hostname`,
      value: cluster.clusterEndpoint.hostname
    });

	  // Export the Port of the DB Cluster Endpoint
	  new CfnOutput(this, 'DB Cluster Endpoint Port', {
      exportName: `${envPrefix}-db-cluster-endpoint-port`,
      value: cluster.clusterEndpoint.port.toString()
    });    

	  // Export the ID of the DB Cluster Security Group
	  new CfnOutput(this, 'DB Cluster Security Group ID', {
      exportName: `${envPrefix}-db-cluster-securitygroup-id`,
      value: rdsClusterSecurityGroup.securityGroupId
    });
  }
}
