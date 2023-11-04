import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Pipeline, Artifact } from 'aws-cdk-lib/aws-codepipeline';
import { GitHubSourceAction, CodeBuildAction, CodeDeployServerDeployAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { PipelineProject, LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { ServerDeploymentGroup, ServerApplication, InstanceTagSet } from 'aws-cdk-lib/aws-codedeploy';
import { Bucket } from 'aws-cdk-lib/aws-s3';


export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // environment specific variables
    const envPrefix = 'dev';
    const githubSecretName = 'github-token';
    const githubOwner = 'Connie-B';
    const githubRepo = 'aws-simple-java-web-app';
    const githubBranch = 'main';


    // Find existing S3 Bucket
    // this requires an S3 Bucket already created with a name of 'mydev-artifacts-bucket'
    const existingBucketArn = `arn:aws:s3:::mydev-artifacts-bucket`;
    const artifactsBucket = Bucket.fromBucketArn(this, 'artifactsBucket', existingBucketArn);


    // CodePipeline
    const pipeline = new Pipeline(this, `${envPrefix}-WebPipeline`,{
      pipelineName: `${envPrefix}-WebAppPipeline`,
      artifactBucket: artifactsBucket,
      crossAccountKeys: false
    });
    
    // Source Stage
    const sourceStage = pipeline.addStage({
      stageName: 'Source'
    });
    // Source action
    // the pipeline is triggered when Github repo is updated
    const sourceOutput = new Artifact();
    const githubSourceAction = new GitHubSourceAction({
      actionName: 'GithubSource',
      oauthToken: cdk.SecretValue.secretsManager(`${githubSecretName}`), 
      owner: `${githubOwner}`,
      repo: `${githubRepo}`,
      branch: `${githubBranch}`,
      // Artifact_S
      output: sourceOutput
    });
    sourceStage.addAction(githubSourceAction);
    
    // Build Stage
    const buildStage = pipeline.addStage({
      stageName: 'Build'
    });
    // Build Action
    // CodeBuild downloads the source code into the build environment and then uses the build specification (buildspec.yml) to create the build environment.
    const javaBuildProject = new PipelineProject(this, `${envPrefix}-JavaBuildProject`,{
      environment: {
        buildImage: LinuxBuildImage.AMAZON_LINUX_2_3
      }
    });
    const javaBuildOutput = new Artifact();
    const javaBuildAction = new CodeBuildAction({
      actionName: 'BuildJava',
      project: javaBuildProject,
      input: sourceOutput,
      // Artifact_B
      outputs: [javaBuildOutput]
    });
    buildStage.addAction(javaBuildAction);
        
    // Deploy Stage
    // The AppSpec file (appspec.yml) contents will be provided to CodeDeploy for the deployment.
    const deployStage = pipeline.addStage({
      stageName: 'Deploy'
    });
    // Deploy Actions
    const deployApplication = new ServerApplication(this,`${envPrefix}-DeployApplication`,{
      applicationName: `${envPrefix}-WebApp`
    });
    // Deployment group
    const serverDeploymentGroup = new ServerDeploymentGroup(this,`${envPrefix}-ServerDeployGroup`,{
      application: deployApplication,
      deploymentGroupName: `${envPrefix}-ServerDeploymentGroup`,
      installAgent: true,
      ec2InstanceTags: new InstanceTagSet(
      {
        'application-name': [`${envPrefix}-WebServer-App`],
        'stage': [`${envPrefix}`]
      })
    });
    // Deployment action
    const deployAction = new CodeDeployServerDeployAction({
      actionName: `${envPrefix}-AppDeployAction`,
      input: javaBuildOutput,
      deploymentGroup: serverDeploymentGroup
    });
    deployStage.addAction(deployAction);

  }
}
