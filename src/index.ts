import fs from "fs";
import chalk from "chalk";
import * as path from "path";
import { CreatePolicyCommand, IAMClient } from "@aws-sdk/client-iam";
import { Installer } from "./installer";

type Options = {
  name: string;
  path: string;
  description?: string;
};

export class Policy {
  constructor(private readonly options: Options) {}

  public async create(): Promise<void> {
    await this.installer();
    await this.createPolicy();
  }

  private async createPolicy(): Promise<void> {
    const policyJson = await this.readJson(this.options.path);
    const policyDocument = this.replaceParamter(policyJson);
    await this.createCommand(policyDocument);
  }

  private async createCommand(policy: string): Promise<void> {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error("AWS credential is not found");
    }

    try {
      const client = new IAMClient({
        credentials: { accessKeyId, secretAccessKey },
      });
      const command = new CreatePolicyCommand({
        PolicyDocument: policy,
        PolicyName: this.options.name,
        Description: this.options.description,
      });
      await client.send(command);
    } catch (error) {
      throw new Error(error as string);
    }
  }

  private replaceParamter(policyDocument: string): string {
    const region = process.env.AWS_REGION;
    const accountId = process.env.AWS_ACCOUNT_ID;

    if (!region || !accountId) {
      const message = chalk.red("AWS region & accountId is not found");
      throw new Error(message);
    }
    policyDocument = policyDocument.replace(/\${Region}/g, region);
    policyDocument = policyDocument.replace(/\${AccountId}/g, accountId);
    return policyDocument;
  }

  private async readJson(filePath: string): Promise<string> {
    try {
      const _filePath = await path.resolve(__dirname, filePath);
      const exists = await fs.existsSync(_filePath);

      if (!exists) {
        throw new Error("JSON file is not found");
      }
      return await fs.promises.readFile(_filePath, "utf-8");
    } catch (error) {
      throw new Error("JSON file is not vaid");
    }
  }

  private async installer(): Promise<void> {
    const installer = new Installer();
    await installer.check();
  }
}

const run = async () => {
  const policy = new Policy({
    name: "test",
    description: "test",
    path: "../policies/deployment.policy.json",
  });
  await policy.create();
};
run();
