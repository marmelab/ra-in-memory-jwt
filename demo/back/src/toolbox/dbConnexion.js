const knex = require('knex');
const knexfile = require('../../knexfile');

let dbClient;
module.exports = {
    getDbClient: function () {
        if (dbClient) return dbClient;
        dbClient = knex(knexfile);
        return dbClient;
    },
};
