const querystring = require('querystring');

/**
 * @typedef {Object} PaginationParameters
 * @property {number} perPage - The number of objects requested per page
 * @property {number} currentPage - The requested page number
 */

/**
 * Function to clean the pagination sent in query parameters
 *
 * @param {PaginationParameters} pagination - pagination object from query parameters
 * @returns {PaginationParameters} Ready-to-use filters for the sql query
 */
const paginationSanitizer = ({ perPage, currentPage }) => {
    const convertedPagination = {
        perPage: parseInt(perPage, 10) || 10,
        currentPage: parseInt(currentPage, 10) || 1,
    };

    return {
        perPage:
            convertedPagination.perPage < 1 ? 10 : convertedPagination.perPage,
        currentPage:
            convertedPagination.currentPage < 1
                ? 1
                : convertedPagination.currentPage,
    };
};

/**
 * Function to return a single pagination information
 *
 * @param {object}
 * @returns {String}
 * @example </api/job-postings?currentPage=1&perPage=10>; rel="self"
 */
const linkHeaderItem = ({ resourceURI, currentPage, perPage, rel }) => {
    const params = {
        currentPage,
        perPage,
    };
    return `<${resourceURI}?${querystring.stringify(params)}>; rel="${rel}"`;
};

/**
 * Function to return a fill pagination information with
 * first, prev, self, next and last relations.
 *
 * @param {object}
 * @returns {String}
 */
const formatPaginationToLinkHeader = ({ resourceURI, pagination = {} }) => {
    const { currentPage, perPage, lastPage } = pagination;

    if (!resourceURI || !currentPage || !perPage || !lastPage) {
        return null;
    }

    const prevPage =
        currentPage - 1 <= lastPage && currentPage - 1 > 0
            ? currentPage - 1
            : currentPage;
    const nextPage =
        currentPage + 1 <= lastPage ? currentPage + 1 : currentPage;

    let items = [
        { resourceURI, currentPage: 1, perPage, rel: 'first' },
        {
            resourceURI,
            currentPage: prevPage,
            perPage,
            rel: 'prev',
        },
        { resourceURI, currentPage, perPage, rel: 'self' },
        {
            resourceURI,
            currentPage: nextPage,
            perPage,
            rel: 'next',
        },
        {
            resourceURI,
            currentPage: lastPage,
            perPage,
            rel: 'last',
        },
    ];

    return items.map((item) => linkHeaderItem(item)).join(',');
};

module.exports = {
    paginationSanitizer,
    formatPaginationToLinkHeader,
};
