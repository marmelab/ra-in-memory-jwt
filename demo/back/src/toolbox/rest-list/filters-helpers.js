/**
| operator | relevant for                  | explanation                 |
| -------- | ----------------------------- | --------------------------- |
| eq       | string, number, date, boolean | Is equal to                 |
| neq      | string, number, date, boolean | Is not equal to             |
| gt       | number, date                  | Is greater than             |
| gte      | number, date                  | Is greater than or equal to |
| lt       | number, date                  | Is less than                |
| lte      | number, date                  | Is less than or equal to    |
| in       | string, number, date          | Is in                       |
| nin      | string, number, date          | Is not in                   |
| %l%      | string                        | Is %LIKE%                   |
| %l       | string                        | Is %LIKE                    |
| l%       | string                        | Is LIKE%                    |
*/
const FILTER_OPERATOR_EQ = 'eq';
const FILTER_OPERATOR_NEQ = 'neq';
const FILTER_OPERATOR_GT = 'gt';
const FILTER_OPERATOR_GTE = 'gte';
const FILTER_OPERATOR_LT = 'lt';
const FILTER_OPERATOR_LTE = 'lte';
const FILTER_OPERATOR_IN = 'in';
const FILTER_OPERATOR_NIN = 'nin';
const FILTER_OPERATOR_PLP = '%l%';
const FILTER_OPERATOR_PL = '%l';
const FILTER_OPERATOR_LP = 'l%';
const filterOperators = [
    FILTER_OPERATOR_EQ,
    FILTER_OPERATOR_NEQ,
    FILTER_OPERATOR_GT,
    FILTER_OPERATOR_GTE,
    FILTER_OPERATOR_LT,
    FILTER_OPERATOR_LTE,
    FILTER_OPERATOR_IN,
    FILTER_OPERATOR_NIN,
    FILTER_OPERATOR_LP,
    FILTER_OPERATOR_PL,
    FILTER_OPERATOR_PLP,
];

/**
 * @typedef {Object} FilterParameters
 * @property {string} name - The name of the property to which the filter applies
 * @property {(string|number|boolean)} value - The value of the filter
 * @property {string} operator - The filter operator : eq, neq, lt, ...
 */

/**
 * Method to clean the filters sent in query parameters
 *
 * @param {Object} filters from query parameters of type { foo: 'bar:eq', ... }
 * @param {Array} filterableFields the fields allowed to be used as a filter
 * @returns {Array.<FilterParameters>} An array of filter parameters
 */
const filtersSanitizer = (filters, filterableFields) => {
    if (!filters || typeof filters !== 'object') {
        return [];
    }

    let sanitizedFilters = Object.keys(filters)
        .map((filterKey) => {
            let unparsedValue = filters[filterKey];

            if (unparsedValue === null) {
                return { name: filterKey, value: null, operator: 'eq' };
            }

            if (
                unparsedValue === undefined ||
                unparsedValue.trim().length == 0 ||
                !filterableFields.includes(filterKey)
            ) {
                return null;
            }

            let [value, operator] = unparsedValue.split(':');

            return {
                name: filterKey,
                value: value,
                operator:
                    !operator || !filterOperators.includes(operator)
                        ? FILTER_OPERATOR_EQ
                        : operator,
            };
        })
        .filter((filter) => filter !== null);

    return sanitizedFilters;
};

module.exports = {
    FILTER_OPERATOR_EQ,
    FILTER_OPERATOR_GT,
    FILTER_OPERATOR_GTE,
    FILTER_OPERATOR_IN,
    FILTER_OPERATOR_LP,
    FILTER_OPERATOR_LT,
    FILTER_OPERATOR_LTE,
    FILTER_OPERATOR_NEQ,
    FILTER_OPERATOR_NIN,
    FILTER_OPERATOR_PL,
    FILTER_OPERATOR_PLP,
    filterOperators,
    filtersSanitizer,
};
