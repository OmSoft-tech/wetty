import { expect } from 'chai';
import 'mocha';
import { loginOptions } from './login.js';
import { sshOptions } from './ssh.js';

describe('command options', () => {
  describe('sshOptions', () => {
  it('should generate ssh command with host and port', () => {
    const args = sshOptions({
      host: 'example.com',
      port: '22',
      pass: '',
      command: 'login',
      auth: 'password',
      knownHosts: '/dev/null',
      config: '',
    });
    expect(args).to.include('ssh');
    expect(args).to.include('example.com');
    expect(args).to.include('-p');
    expect(args).to.include('22');
  });

  it('should include sshpass -e when password is provided', () => {
    const args = sshOptions({
      host: 'example.com',
      port: '22',
      pass: 'secret123',
      command: 'login',
      auth: 'password',
      knownHosts: '/dev/null',
      config: '',
    });
    expect(args).to.include('sshpass');
    expect(args).to.include('-e');
    expect(args).to.not.include('secret123');  // пароля нет в аргументах
  });

  it('should not include sshpass when no password', () => {
    const args = sshOptions({
      host: 'localhost',
      port: '22',
      pass: '',
      command: 'login',
      auth: 'password',
      knownHosts: '/dev/null',
      config: '',
    });
    expect(args).to.not.include('sshpass');
  });

  it('should set SSHPASS env variable when password is provided', () => {
    const original = process.env.SSHPASS;
    delete process.env.SSHPASS;

    sshOptions({
      host: 'example.com',
      port: '22',
      pass: 'my-pass',
      command: 'login',
      auth: 'password',
      knownHosts: '/dev/null',
      config: '',
    });

    expect(process.env.SSHPASS).to.equal('my-pass');

    // cleanup
    if (original) process.env.SSHPASS = original;
    else delete process.env.SSHPASS;
  });

  it('should include custom command', () => {
    const args = sshOptions({
      host: 'example.com',
      port: '22',
      pass: '',
      command: '/bin/bash',
      auth: 'password',
      knownHosts: '/dev/null',
      config: '',
    });
    expect(args).to.include('/bin/bash');
  });

  it('should respect knownHosts setting', () => {
    const args = sshOptions({
      host: 'example.com',
      port: '22',
      pass: '',
      command: 'login',
      auth: 'password',
      knownHosts: '/dev/null',
      config: '',
    });
    expect(args.join(' ')).to.include('StrictHostKeyChecking=no');

    const strictArgs = sshOptions({
      host: 'example.com',
      port: '22',
      pass: '',
      command: 'login',
      auth: 'password',
      knownHosts: '~/.ssh/known_hosts',
      config: '',
    });
    expect(strictArgs.join(' ')).to.include('StrictHostKeyChecking=yes');
  });

  it('should include ssh config file when provided', () => {
    const args = sshOptions({
      host: 'example.com',
      port: '22',
      pass: '',
      command: 'login',
      auth: 'password',
      knownHosts: '/dev/null',
      config: '~/.ssh/config',
    });
    expect(args).to.include('-F');
    expect(args).to.include('~/.ssh/config');
  });

  it('should include private key when provided', () => {
    const args = sshOptions({
      host: 'example.com',
      port: '22',
      pass: '',
      command: 'login',
      auth: 'publickey',
      knownHosts: '/dev/null',
      config: '',
    }, '~/.ssh/id_rsa');
    expect(args).to.include('-i');
    expect(args).to.include('~/.ssh/id_rsa');
  });
});

  describe('loginOptions', () => {
  it('should return login command with remote address for default login', () => {
    const args = loginOptions('login', '::ffff:192.168.1.1');
    expect(args).to.deep.equal(['login', '-h', '192.168.1.1']);
  });

  it('should return login command with localhost when no remote address', () => {
    const args = loginOptions('login', '::1');
    expect(args).to.deep.equal(['login', '-h', 'localhost']);
  });

  it('should return custom command directly', () => {
    const args = loginOptions('/bin/bash', '::ffff:192.168.1.1');
    expect(args).to.deep.equal(['/bin/bash']);
  });

  it('should return custom command even with ipv4 remote address', () => {
    const args = loginOptions('/bin/zsh', '192.168.1.1');
    expect(args).to.deep.equal(['/bin/zsh']);
  });
});
});
