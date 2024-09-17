import path from 'node:path'
import process from 'node:process'
import type yargs from 'yargs'
import consola from 'consola'
import { deploy } from 'sftp-sync-deploy'
import { defaultSiteConfig } from '../config/site'
import { exists } from './utils/fs'

export async function deployDist() {
  const distDir = path.join(process.cwd(), 'dist')

  const sftpConfig = defaultSiteConfig.deploy

  consola.box('🚀 Starting deployment...')

  if (await exists(distDir)) {
    consola.info('dist directory found, deploying...')

    const config = {
      host: sftpConfig.host,
      port: sftpConfig.port || 22,
      username: sftpConfig.user,
      password: sftpConfig.password,
      localDir: distDir,
      remoteDir: sftpConfig.remotePath || '/var/www/html',
    }

    const options = {
      dryRun: false,
      forceUpload: sftpConfig.forceUpload || false,
      excludeMode: 'remove' as const,
      concurrency: 100,
    }

    try {
      // 使用 sftp.deploy 方法进行部署
      await deploy(config, options)
      consola.success('Deployment completed successfully.')
    }
    catch (error) {
      consola.error('Deployment failed.')
      consola.error(error)
    }
  }
  else {
    consola.info('No dist directory found, nothing to deploy.')
  }
}

export function registerDeployCommand(cli: yargs.Argv) {
  cli.command(
    'deploy',
    'Deploy the dist folder to remote server',
    () => { },
    async () => {
      await deployDist()
    },
  )
}
