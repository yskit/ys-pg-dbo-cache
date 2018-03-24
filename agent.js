// const fs = require('fs');
// const path = require('path');
// const { ContextLoader, FileLoader } = require('ys-loader');

module.exports = (component, agent) => {
  // const cwd = agent.options.baseDir;
  // const cache = {};
  // const cacheDir = path.resolve(cwd, 'app/cache');
  // const configs = component.options;
  
  // if (!fs.existsSync(cacheDir)) {
  //   throw new Error('找不到缓存文件夹：' + cacheDir);
  // }

  // new ContextLoader(Object.assign({}, {
  //   directory: cacheDir,
  //   target: agent,
  //   inject: agent,
  //   property: 'cache',
  //   runtime(Class, ctx) {
  //     return class transformClassModule extends Class {
  //       constructor(mysql, redis) {
  //         super(ctx, mysql, redis, configs.name);
  //       }
  //     }
  //   }
  // }, configs.loader || {})).load();
}