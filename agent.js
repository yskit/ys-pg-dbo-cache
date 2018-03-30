// const path = require('path');
// const { ContextLoader } = require('ys-loader');

module.exports = (component, agent) => {
  // const cwd = component.cwd;
  // component.on('beforeLoadFiles', () => {
  //   component.loader.cache = [
  //     path.resolve(cwd, 'agent', 'cache'),
  //     path.resolve(agent.options.baseDir, 'app', 'cache')
  //   ];
  // });

  // agent.on('serverWillStart', () => {
  //   const loadCount = new ContextLoader({
  //     directory: component.loader.cache,
  //     target: component,
  //     inject: component,
  //     property: 'cache',
  //     runtime(Class, ctx) {
  //       return class transformClassModule extends Class {
  //         constructor(mysql, redis) {
  //           super(ctx, mysql, redis, component.options.name);
  //         }
  //       }
  //     }
  //   }).load();
  //   if (!component.loader.isPro && loadCount) component.loader.log('cache');
  // });
}