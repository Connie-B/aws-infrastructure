import { Construct } from 'constructs';
import { DatabaseCluster, DatabaseClusterEngine, AuroraMysqlEngineVersion, ClusterInstance } from 'aws-cdk-lib/aws-rds';
import { Key } from 'aws-cdk-lib/aws-kms';
import { RemovalPolicy, SecretValue } from 'aws-cdk-lib';
import { IVpc, SubnetType, SecurityGroup, InstanceType, InstanceClass, InstanceSize } from 'aws-cdk-lib/aws-ec2';


export interface DatabaseClusterConfig {
  vpc: IVpc,
  securityGroup: SecurityGroup,
  username: string,
  credsSecretName: string,
  databasename: string
}
  
export class DatabaseClusterBuilder {

  static buildDatabaseCluster(scope: Construct, id: string, config: DatabaseClusterConfig): DatabaseCluster {

    // Create encryption key for RDS database
    const rdsKey = new Key(scope, `${id}-RdsKey1`, {
      alias: `${id}/mysql/rds`,
      description: 'Encryption key for RDS',
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY
    });
  
    // Create RDS instances
    const cluster = new DatabaseCluster(scope, `${id}-Cluster`, {
      engine: DatabaseClusterEngine.auroraMysql({
        // Aurora MySQL 3.04 versions are compatible with MySQL 8.0.28
        version: AuroraMysqlEngineVersion.VER_3_04_0
      }),
      
      writer: ClusterInstance.provisioned(`${id}-Writer`, {
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM),
      }),
      vpc: config.vpc,
      vpcSubnets: {
          subnetType: SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [config.securityGroup],
      serverlessV2MinCapacity: .5,
      serverlessV2MaxCapacity: 2,
      // @default - no readers are created. The cluster will have a single writer/reader
      // readers: [
      //   // will be put in promotion tier 1 and will scale with the writer
      //   rds.ClusterInstance.serverlessV2('reader1', { scaleWithWriter: true }),
      //   // will be put in promotion tier 2 and will not scale with the writer
      //   // rds.ClusterInstance.serverlessV2('reader2'),
      // ],
      
      credentials: { 
        username: config.username,
        password: SecretValue.secretsManager(config.credsSecretName)
      },
      defaultDatabaseName: config.databasename,
      removalPolicy: RemovalPolicy.DESTROY,
      storageEncryptionKey: rdsKey
    });

    return cluster;
  }
}