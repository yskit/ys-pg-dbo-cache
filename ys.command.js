const fs = require('fs-extra');
const path = require('path');
const dbo = require('ys-dbo');
const { spawnSync } = require('child_process');

// 使用插件的json配置
exports.use = "{ enable: true, package: 'ys-pg-dbo-cache', agent: \'agent\' }";
// 插件通用配置
exports.common = '{ name: \'cache\', loader: {} }';
// 初始安装插件时候调用周期
exports.installer = async ({ cwd, log }) => {
  const cacheDir = path.resolve(cwd, 'app/cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
  }
  const testFile = path.resolve(cacheDir, 'test.js');
  if (!fs.existsSync(testFile)) {
    fs.writeFileSync(testFile, template('test'), 'utf8');
  }
};
// 卸载插件时候调用周期
exports.uninstaller = async ({ cwd }) => {
  const cacheDir = path.resolve(cwd, 'app/cache');
  if (fs.existsSync(cacheDir)) {
    const code = spawnSync('rm', ['-rf', 'app/cache'], {
      stdio: 'inherit',
      cwd
    });
  
    if (!code) {
      throw new Error('Run command catch error');
    }
  }
};
// 支持ys-cli命令的功能
exports.command = ({ app, log, root }) => {
  app.command('cache <name>')
    .describe('创建一个新的缓存模块')
    .action(name => {
      new dbo().until(async thread => {
        const relativePath = path.relative(root, process.cwd());
        const cachePath = path.resolve(root, 'app/cache');
        const isInCacheDir = relativePath.indexOf('app/cache') === 0;
        if (isInCacheDir) {
          return exports.addFile(process.cwd(), name, log);
        }
        await exports.addFile(cachePath, name, log);
      }, {
        error(e) {
          log.error(e.message);
          process.exit(1);
        }
      });
    });
};

exports.addFile = async (cwd, name, log) => {
  name = name.replace(/\.js$/i, '');
  if (!/^[a-z][a-z0-9_/]*$/.test(name)) {
    throw new Error('模块命名不规范');
  }
  const filePath = path.resolve(cwd, name + '.js');
  const dir = path.dirname(filePath);
  fs.ensureDirSync(dir);
  if (fs.existsSync(filePath)) {
    throw new Error(`file '${filePath}' is already exists.`);
  }
  const data = template(name);
  fs.writeFileSync(filePath, data, 'utf8');
  log.success(`写入缓存文件成功 - '${filePath}'`);
}

function template(name) {
  const cachename = name.charAt(0).toUpperCase() + name.substring(1);
  return `const Cache = require('ys-pg-dbo-cache');

module.exports = class ${cachename}Cache extends Cache {
  constructor(...args) {
    super(...args);
  }

  async ['/test/dbo']() {
    const mysql = this.mysql;
    await mysql.get();
    return await mysql.exec(\`select COUNT(table_name) AS Count from information_schema.tables where table_schema='\${mysql.mysql.options.database}'\`);
  }
}`;
}