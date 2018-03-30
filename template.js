module.exports = function template(name) {
  name = name.split('/').slice(-1)[0];
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