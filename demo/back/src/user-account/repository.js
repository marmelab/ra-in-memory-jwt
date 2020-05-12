const { getDbClient } = require('../toolbox/dbConnexion');

const tableName = `user_account`;
const authorizedFilters = ['username', 'createdAt'];
const authorizedSort = ['id', 'username', 'createdAt'];

/**
 * Return paginated and filtered list of users
 *
 * @param {object} queryParameters - An object of query parameters from Koa
 * @returns {Promise} - paginated object with paginated users list and pagination
 */
const getPaginatedList = async (queryParameters) => {
    const client = getDbClient();
    return client(tableName)
        .select('id', 'username', 'createdAt')
        .paginateRestList({
            queryParameters,
            authorizedFilters,
            authorizedSort,
        })
        .then(({ data, pagination }) => ({
            users: data,
            pagination,
        }))
        .catch((error) => ({ error }));
};

/**
 * Return a user account if exist
 *
 * @param {string} username - The searched username
 * @returns {Promise} - the user
 */
const getOneByUsername = async (username) => {
    const client = getDbClient();
    return client(tableName)
        .first('*')
        .where({ username })
        .catch((error) => ({ error }));
};

/**
 * Return a user account if exist
 *
 * @param {string} id - The user id
 * @returns {Promise} - the user
 */
const getOne = async (id) => {
    const client = getDbClient();
    return client(tableName)
        .first('*')
        .where({ id })
        .catch((error) => ({ error }));
};

module.exports = {
    getPaginatedList,
    getOne,
    getOneByUsername,
};
