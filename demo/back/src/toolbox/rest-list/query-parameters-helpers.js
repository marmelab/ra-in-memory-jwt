/**
 * @typedef {Object} SortParameters
 * @property {string} sortBy - The name of the property to which the sort applies
 * @property {string} orderBy - The sort order. Could be 'ASC' or 'DESC'
 */

/**
 * @typedef {Object} PaginationParameters
 * @property {number} perPage - The number of objects requested per page
 * @property {number} currentPage - The requested page number
 */

/**
 * @typedef {Object} FormatedQueryParameters
 * @property {(SortParameters || null)} sort - The sort parameters
 * @property {PaginationParameters} pagination - The pagination parameters
 * @property {Object} filters - The filters with name as key and value:operator as value
 */

/**
 * Format the parameters from the query
 *
 * @module rest-list
 * @param {Object} query - The query parameters
 * @returns {FormatedQueryParameters} The extracted parameters, ready for sanitizing
 */
const formatQueryParameters = ({
    sortBy,
    orderBy,
    currentPage,
    perPage,
    ...filters
} = {}) => {
    return {
        sort: sortBy ? { sortBy, orderBy: orderBy || 'ASC' } : null,
        pagination: {
            currentPage: currentPage || 1,
            perPage: perPage || 10,
        },
        filters,
    };
};

module.exports = {
    formatQueryParameters,
};
