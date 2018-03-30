const fs = require('fs-extra');
const path = require('path');
const template = require('./template');
const jsbeautifier = require('js-beautify');

module.exports = class CommanderModule {
  constructor(thread, installer) {
    this.installer = installer;
    this.thread = thread;
  }

  beautiful(str) {
    return jsbeautifier.js_beautify(str, {
      indent_size: 2
    })
  }

  addFile(cwd, name) {
    name = name.replace(/\.js$/i, '');
    if (!/^[a-z][a-z0-9_/]*$/.test(name)) {
      throw new Error('模块命名不规范');
    }
    const filePath = path.resolve(cwd, name + '.js');
    const dir = path.dirname(filePath);
    const filename = path.basename(filePath, '.js');
    fs.ensureDirSync(dir);
    if (fs.existsSync(filePath)) {
      throw new Error(`file '${filePath}' is already exists.`);
    }
    const data = this.beautiful(template(filename));
    fs.writeFileSync(filePath, data, 'utf8');
    this.thread.on('beforeRollback', async () => {
      this.installer.spinner.debug('-', path.relative(process.cwd(), filePath));
      fs.unlinkSync(filePath);
      await this.installer.delay(50);
    });
    this.installer.spinner.success('+', path.relative(process.cwd(), filePath));
  }

  async render(name) {
    const root = this.installer.root;
    const type = this.installer.type;
    if (!root || type !== 'framework') {
      throw new Error('非项目目录无法使用此命令');
    }
    const relativePath = path.relative(root, process.cwd());
    const cachePath = path.resolve(root, 'app/cache');
    const isInCacheDir = relativePath.indexOf('app/cache') === 0;
    if (isInCacheDir) {
      return this.addFile(process.cwd(), name);
    }
    this.addFile(cachePath, name);
  }
}