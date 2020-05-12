const config = require('./src/config');
const knexStringcase = require('knex-stringcase');
const { attachPaginateRestList } = require('./src/toolbox/rest-list');

attachPaginateRestList();
const knexConfig = {
    client: 'pg',
    connection: config.db,
    migrations: {
        tableName: 'migrations',
    },
    pool: { min: 1, max: 7 },
};

module.exports = knexStringcase(knexConfig);