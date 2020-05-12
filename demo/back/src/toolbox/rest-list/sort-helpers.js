/**
 * @typedef {Object} SortParameters
 * @property {string} sortBy - The name of the property to which the sort applies
 * @property {string} orderBy - The sort order. Could be 'ASC' or 'DESC'
 */

/**
 * Method to clean the sort sent in query parameters
 *
 * @param {SortParameters} sort - sort from query parameters
 * @param {Array} sortableFields the fields allowed to be used as a sort
 * @returns {Array} Ready-to-use filters for the sql query
 */
const sortSanitizer = (sort, sortableFields) => {
    if (!sort) {
        return { sortBy: sortableFields[0], orderBy: 'ASC' };
    }
    const { sortBy, orderBy } = sort;
    if (
        orderBy === undefined ||
        sortBy === undefined ||
        !sortableFields.includes(sortBy)
    ) {
        return { sortBy: sortableFields[0], orderBy: 'ASC' };
    }

    if (!['ASC', 'DESC'].includes(orderBy)) {
        return { sortBy, orderBy: 'ASC' };
    }

    return { sortBy, orderBy };
};

module.exports = {
    sortSanitizer,
};
