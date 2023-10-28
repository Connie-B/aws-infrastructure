#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { PipelineStack } from '../lib/pipeline-stack';

// environment specific variables
const envPrefix = 'dev';

const app = new cdk.App();
const vpcStack = new VpcStack(app, `${envPrefix}-VpcStack`);
const pipelineStack = new PipelineStack(app, `${envPrefix}-PipelineStack`);
