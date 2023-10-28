import { Vpc, IpAddresses, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';


export class VpcBuilder {

  static buildVpc(scope: Construct, id: string) {

    // Create standard VPC
    const newVpc = new Vpc(scope, id, {
      maxAzs: 3,
      natGateways: 1,
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-w-egress',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'private-isolated',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        }
      ]
    });

    return newVpc;
  }
}