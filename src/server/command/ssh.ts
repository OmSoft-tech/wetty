import { logger } from '../../shared/logger.js';

export function sshOptions(
  {
    pass,
    path,
    command,
    host,
    port,
    auth,
    knownHosts,
    config,
  }: Record<string, string>,
  key?: string,
): string[] {
  const cmd = parseCommand(command, path);
  const hostChecking = knownHosts !== '/dev/null' ? 'yes' : 'no';
  logger().info(`Authentication Type: ${auth}`);

  // Use SSHPASS env variable instead of -p flag to avoid leaking
  // the password in ps aux output
  if (pass) {
    process.env.SSHPASS = pass;
  }

  return [
    ...pass ? ['sshpass', '-e'] : [],
    'ssh',
    '-t',
    ...(config ? ['-F', config] : []),
    ...(port ? ['-p', port] : []),
    ...(key ? ['-i', key] : []),
    ...(auth !== 'none' ? ['-o', `PreferredAuthentications=${auth}`] : []),
    '-o',
    `UserKnownHostsFile=${knownHosts}`,
    '-o',
    `StrictHostKeyChecking=${hostChecking}`,
    '-o',
    'EscapeChar=none',
    '--',
    host,
    ...(cmd ? [cmd] : []),
  ];
}

function parseCommand(command: string, path?: string): string {
  if (command === 'login' && path === undefined) return '';
  return path !== undefined
    ? `$SHELL -c "cd ${path};${command === 'login' ? '$SHELL' : command}"`
    : command;
}
