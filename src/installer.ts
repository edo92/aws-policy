import fs from "fs";
import path from "path";
import https from "https";
import chalk from "chalk";
import readline from "readline";
import loading from "loading-cli";
import { exec } from "child_process";
import command from "command-exists";

const installerUrl = "https://awscli.amazonaws.com/AWSCLIV2.pkg";

export class Installer {
  private get filePath(): string {
    const filename = "installer.pkg";
    return path.resolve(__dirname, filename);
  }

  public async check(): Promise<void> {
    try {
      await command("aws");
      return;
    } catch (error) {
      this.prompt();
    }
  }

  private prompt(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    const load = loading("installing...");

    rl.question(this.message(), (name) => {
      if (name.toLocaleLowerCase() !== "y") {
        rl.close();
        console.log(chalk.yellow("Canceled"));
        return;
      }

      this.downloadInstaller(async () => {
        rl.close();
        await this.install();
        load.stop();
        fs.unlinkSync(this.filePath);
      });

      load.start();
    });
  }

  private downloadInstaller(callback: () => void): void {
    const file = fs.createWriteStream(this.filePath);

    https.get(installerUrl, (response) => {
      response.pipe(file);

      file.on("finish", () => {
        file.close();
        callback();
      });
    });
  }

  private async install(): Promise<void> {
    await exec(`sudo installer -pkg ${this.filePath} -target /`, (error) => {
      if (error) {
        throw new Error(error.message);
      }
    });
  }

  private message(): string {
    console.log(chalk.red("\n \t Aws cli is not installed"));
    return chalk.gray("\t Would you like to install ? (y/n)  ");
  }
}
