const knex = require('knex');
const knexfile = require('../../../knexfile');

const db = knex(knexfile);

const dbConnexionMiddleware = async (ctx, next) => {
    ctx.db = db;
    await next();
};

module.exports = dbConnexionMiddleware;
