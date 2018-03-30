const fs = require('fs-extra');
const path = require('path');
const Commander = require('./command');
const template = require('./template');
const jsbeautifier = require('js-beautify');

module.exports = class CommanderModule {
  constructor(thread, installer) {
    this.installer = installer;
    this.thread = thread;
  }

  static ['command:framework'](app, installer) {
    app.command('cache <name>')
      .describe('创建一个新的缓存文件')
      .action(installer.task(Commander));
  }

  beautiful(str) {
    return jsbeautifier.js_beautify(str, {
      indent_size: 2
    })
  }

  ['options:plugin']() {
    return {
      enable: true,
      package: 'ys-pg-dbo-cache',
      agent: ['agent'],
      dependencies: []
    }
  }

  ['env:common']() {
    return {
      name: 'cache',
      loader: {}
    }
  }

  async ['life:created']({ cwd }) {
    const cacheDir = path.resolve(cwd, 'app/cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir);
      this.thread.on('beforeRollback', async () => {
        this.installer.spinner.debug('-', path.relative(process.cwd(), cacheDir));
        fs.removeSync(cacheDir);
        await this.installer.delay(50);
      });
    }
    const testFile = path.resolve(cacheDir, 'test.js');
    if (!fs.existsSync(testFile)) {
      fs.writeFileSync(testFile, this.beautiful(template('test')), 'utf8');
      this.thread.on('beforeRollback', async () => {
        this.installer.spinner.debug('-', path.relative(process.cwd(), testFile));
        fs.unlinkSync(testFile);
        await this.installer.delay(50);
      });
    }
  }

  async ['life:destroyed']({ cwd }) {
    this.installer.spinner.warn('正在删除项目中的缓存文件 ...');
    await this.installer.execScript(cwd, 'rm', '-rf', 'app/cache');
    this.installer.spinner.warn('项目中的缓存文件删除成功！');
    await this.installer.delay(50);
  }
}