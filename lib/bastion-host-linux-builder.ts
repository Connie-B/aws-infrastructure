import { Construct } from 'constructs';
import { IVpc, SubnetType, BastionHostLinux, Instance, CfnInstance, SecurityGroup } from 'aws-cdk-lib/aws-ec2';


export interface BastionHostLinuxConfig {
  vpc: IVpc,
  keyName: string,
  securityGroup: SecurityGroup
}

export class BastionHostLinuxBuilder {

  static buildBastionHost(scope: Construct, id: string, config: BastionHostLinuxConfig): BastionHostLinux {

    // Create bastion host instance in public subnet
    const bastionHostLinux = new BastionHostLinux(scope, `${id}-Host`, {
    vpc: config.vpc,
    securityGroup: config.securityGroup,
    subnetSelection: {
        subnetType: SubnetType.PUBLIC
    }
    });
    // workaround to connect to Bastion with ssh Key since BastionHostLinux has no keyName property
    // The recommended way to connect to this bastion host is to use session manager and not use SSH
    const instance = bastionHostLinux.node.defaultChild as Instance;
    const cfnInstance = instance.node.defaultChild as CfnInstance;
    cfnInstance.keyName = config.keyName;

    return bastionHostLinux;
  }
}