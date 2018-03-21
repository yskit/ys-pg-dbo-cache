const fs = require('fs');
const path = require('path');
const { ContextLoader } = require('ys-loader');

module.exports = (app, configs = {}) => {
  const cwd = app.options.baseDir;
  const cache = {};
  const cacheDir = path.resolve(cwd, 'app/cache');
  
  if (!fs.existsSync(cacheDir)) {
    throw new Error('找不到缓存文件夹：' + cacheDir);
  }

  new ContextLoader(Object.assign({}, {
    directory: cacheDir,
    target: app,
    inject: app.koa,
    property: 'cache',
    runtime(Class, ctx) {
      return class transformClassModule extends Class {
        constructor(mysql, redis) {
          super(ctx, mysql, redis, configs.name);
        }
      }
    }
  }, configs.loader || {})).load();
}