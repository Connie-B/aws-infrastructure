import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Peer, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';

import { VpcBuilder } from './vpc-builder'
import { InstanceBuilder } from './instance-builder'
import { BastionHostLinuxBuilder } from './bastion-host-linux-builder'
import { DatabaseClusterBuilder } from './database-cluster-builder'

export class VpcStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // environment specific variables
    const envPrefix = 'dev';
    const webServerKeyName = 'devKeyPair';
    const dbUsername = 'admin';
    const dbCredsSecretName = 'mysql-token';


    // create VPC
    const vpc = VpcBuilder.buildVpc(this, `${envPrefix}-Vpc`);
    // Create flowlog and log the vpc traffic into cloudwatch
    vpc.addFlowLog(`${envPrefix}-VpcFlowLog`);

    // create web server instance
    const webServer = InstanceBuilder.buildInstance(this, `${envPrefix}-WebServer`, {
      vpc: vpc, 
      keyName: webServerKeyName
    });


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
      keyName: webServerKeyName,
      securityGroup: bastionSecurityGroup
    });


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


    // Output the details we need to connect to the servers
    
    // Output the public IP address of the Web Server instance
    new CfnOutput(this, "Web Server IP Address", {
    value: webServer.instancePublicIp
    });

    // Output the DNS Name of the Web Server instance
    new CfnOutput(this, "Web Server DNS Name", {
    value: webServer.instancePublicDnsName
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
