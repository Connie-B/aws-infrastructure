#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';

// environment specific variables
const envPrefix = 'dev';

const app = new cdk.App();
const vpcStack = new VpcStack(app, `${envPrefix}-VpcStack`);
