import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';
import { IVpc, SubnetType, Instance, SecurityGroup, Peer, Port, 
  AmazonLinuxImage, AmazonLinuxGeneration, AmazonLinuxCpuType,
  InstanceClass, InstanceType, InstanceSize } from 'aws-cdk-lib/aws-ec2';
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { readFileSync } from 'fs';


export interface WebInstanceConfig {
  vpc: IVpc,
  keyName: string,
  securityGroup: SecurityGroup
}

export class WebInstanceBuilder {

  static buildInstance(scope: Construct, id: string, config: WebInstanceConfig) {

    // Create a Role and attach the needed managed IAM Policies
    const webServerRole = new Role(scope,`${id}-Role`, {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com")
    });
    webServerRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );
    webServerRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonEC2RoleforAWSCodeDeploy")
    );

    // the AMI to be used for the EC2 Instance
    const ami = new AmazonLinuxImage({
      generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: AmazonLinuxCpuType.X86_64
    });
  
    // The actual Web EC2 Instance for the web server
    const newInstance = new Instance(scope, `${id}-Instance`,{
      vpc: config.vpc,
      instanceType: InstanceType.of(
        InstanceClass.T2,
        InstanceSize.MICRO
      ),
      machineImage: ami,
      securityGroup: config.securityGroup,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      role: webServerRole,
      keyName: config.keyName
    });
    // The user data is used to bootstrap the EC2 instance and install specific application packages on the instance's first boot. 
    const webServerUserData = readFileSync('./assets/configure_web_server.sh','utf-8');
    newInstance.addUserData(webServerUserData);
    
    // The tags are used by Systems Manager to identify the instance later on for deployments.
    Tags.of(newInstance).add('instance-name',`${id}-Instance`);
    Tags.of(newInstance).add('stage',`${id}`);

    return newInstance;
  }
}