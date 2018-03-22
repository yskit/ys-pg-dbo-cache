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

  app.on('beforeLoadFiles', () => app._compiler.caches = []);
  app.on('serverWillStart', () => {
    new ContextLoader(Object.assign({}, configs.loader || {}, {
      directory: app._compiler.caches,
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
    })).load();
  });
}