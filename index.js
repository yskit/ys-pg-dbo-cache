/**
 * 缓存模块
 * @since 1.0.0
 * @example 
 *  const cache = new ctx.cache.abc(ctx.ys.mysql, ctx.ys.redis);
 *  const data = await cache.load('/a/b/c/:id(\\d+)', {
 *    id: 999
 *  });
 *  await cache.build('/a/b/c/:id(\\d+)', {
 *    id: 999
 *  });
 *  await cache.delete('/a/b/c/:id(\\d+)', {
 *    id: 999
 *  })
 */
const ysClassic = require('ys-class');
const pathToRegexp = require('path-to-regexp');
const toString = Object.prototype.toString;

class CacheExpire {
  constructor(data, expire) {
    this.data = data;
    this.expire = expire || 0;
  }
}

module.exports = class Cache extends ysClassic {
  constructor(ctx, mysql, redis, name) {
    super(ctx);
    this.mysql = mysql;
    this.redis = redis;
    this.nameSpace = name;
  }

  decode(data) {
    const { type, value } = data;
    switch (type) {
      case 'Object': 
      case 'Array': return JSON.parse(value);
      case 'Date': return new Date(Number(value));
      case 'Number': return Number(value);
      case 'Boolean': return value === 'true' ? true : false;
      case 'String': return value;
      case 'RegExp': return new RegExp(value);
      case 'Undefined': return;
      case 'Null': return null;
      case 'Buffer':
        if (!(value instanceof Buffer)) {
          return new Buffer(value);
        }
        return value;
      case 'ArrayBuffer':
        if (!(value instanceof ArrayBuffer)) {
          return new ArrayBuffer(value);
        }
        return value;
    }
  }

  encode(data) {
    let value;
    if (data instanceof Buffer) {
      return {
        type: 'Buffer',
        value: data
      }
    }
    if (data instanceof ArrayBuffer) {
      return {
        type: 'ArrayBuffer',
        value: data
      }
    }

    const type = toString.call(data).replace('[object ', '').replace(']', '');
    switch (type) {
      case 'Object':
      case 'Array': value = JSON.stringify(data); break;
      case 'Date': value = data.getTime() + ''; break;
      case 'Number': value = data + ''; break;
      case 'Boolean': value = data ? 'true' : 'false'; break;
      case 'String': value = data; break;
      case 'RegExp': value = data.toString(); break;
      case 'Undefined': value = 'undefined'; break;
      case 'Null': value = 'null'; break;
    }

    if (!type || !value) {
      throw new Error('转换数据结构过程出错：未知类型的数据');
    }

    return {
      type, value
    }
  }

  /**
   * 组装路径与参数
   * 变为redis可以识别的路径
   * @param {*} name 
   * @param {*} args 
   */
  path(name, args = {}) {
    name = /^\//.test(name) ? name : '/' + name;
    const pather = pathToRegexp.compile(name)(args).replace(/\//g, ':');
    return this.nameSpace + pather;
  }

  /**
   * 获取缓存
   * @param {*} name 
   * @param {*} args 
   */
  async load(name, args) {
    const road = this.path(name, args);
    const exists = await this.redis.exists(road);
    if (exists) {
      const existsData = await this.redis.hgetall(road);
      return this.decode(existsData);
    }
    return await this.build(name, args);
  }

  /**
   * 生成缓存
   * @param {*} name 
   * @param {*} args 
   * @param {*} data 
   */
  async build(name, args, data) {
    const road = this.path(name, args);
    if (data !== undefined) {
      await this.redis.hmset(road, this.encode(data));
      return data;
    }
    if (!this[name]) {
      throw new Error('更新缓存过程出错：找不到需要更新缓存的函数定义');
    }
    const dataResult = await this[name](args);
    if (dataResult instanceof CacheExpire) {
      await this.redis.hmset(road, this.encode(dataResult.data));
      if (dataResult.expire > 0) {
        await this.redis.expire(road, dataResult.expire / 1000);
      }
      return dataResult.data;
    } else {
      await this.redis.hmset(road, this.encode(dataResult));
      return dataResult;
    }
  }

  /**
   * 设置缓存过期时间
   * @param {*} name 
   * @param {*} args 
   * @param {*} time 毫秒
   */
  async expire(name, args, time) {
    const road = this.path(name, args);
    await this.redis.expire(road, time / 1000);
  }

  /**
   * 删除缓存
   * @param {*} name 
   * @param {*} args 
   */
  async delete(name, args) {
    const road = this.path(name, args);
    const exists = await this.redis.exists(road);
    if (exists) {
      await this.redis.del(road);
    }
  }
}

module.exports.CacheExpire = CacheExpire;