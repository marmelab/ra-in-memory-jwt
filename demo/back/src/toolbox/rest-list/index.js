const Knex = require('knex');
const signale = require('signale');

const {
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
    filtersSanitizer,
} = require('./filters-helpers');
const { paginationSanitizer } = require('./pagination-helpers');
const { formatQueryParameters } = require('./query-parameters-helpers');
const { sortSanitizer } = require('./sort-helpers');

module.exports.attachPaginateRestList = function attachPaginateRestList() {
    Knex.QueryBuilder.extend('paginateRestList', function paginate({
        queryParameters = '',
        authorizedFilters = ['id'],
        authorizedSort = ['id'],
        debug = false,
    }) {
        const isFromStart = false;
        const isLengthAware = true;
        const {
            pagination: rawPagination,
            sort,
            filters,
        } = formatQueryParameters(queryParameters);
        const { perPage, currentPage } = paginationSanitizer(rawPagination);
        const { sortBy, orderBy } = sortSanitizer(sort, authorizedSort);
        const filtersParameters = filtersSanitizer(filters, authorizedFilters);

        if (debug) {
            signale.debug('queryParameters', queryParameters);
            signale.debug(
                'Formated query parameters',
                formatQueryParameters(queryParameters)
            );
            signale.debug('perPage', perPage);
            signale.debug('currentPage', currentPage);
            signale.debug('sortBy', sortBy);
            signale.debug('orderBy', orderBy);
            signale.debug('filters', filtersParameters);
        }

        // Filter stuff
        if (filtersParameters && filtersParameters.length) {
            filtersParameters.map((filter) => {
                switch (filter.operator) {
                    case FILTER_OPERATOR_EQ:
                        this.andWhere(filter.name, '=', filter.value);
                        break;
                    case FILTER_OPERATOR_NEQ:
                        this.andWhere(filter.name, '!=', filter.value);
                        break;
                    case FILTER_OPERATOR_LT:
                        this.andWhere(filter.name, '<', filter.value);
                        break;
                    case FILTER_OPERATOR_LTE:
                        this.andWhere(filter.name, '<=', filter.value);
                        break;
                    case FILTER_OPERATOR_GT:
                        this.andWhere(filter.name, '>', filter.value);
                        break;
                    case FILTER_OPERATOR_GTE:
                        this.andWhere(filter.name, '>=', filter.value);
                        break;
                    case FILTER_OPERATOR_PLP:
                        this.andWhere(
                            filter.name,
                            'ILIKE',
                            `%${filter.value}%`
                        );
                        break;
                    case FILTER_OPERATOR_PL:
                        this.andWhere(filter.name, 'ILIKE', `%${filter.value}`);
                        break;
                    case FILTER_OPERATOR_LP:
                        this.andWhere(filter.name, 'ILIKE', `${filter.value}%`);
                        break;
                    case FILTER_OPERATOR_IN:
                        this.whereIn(filter.name, filter.value);
                        break;
                    case FILTER_OPERATOR_NIN:
                        this.whereNotIn(filter.name, filter.value);
                        break;
                    default:
                        debug &&
                            signale.log(
                                `The filter operator ${filter.operator} is not managed`
                            );
                }
            });
        }

        // Sort stuff
        this.orderBy(sortBy, orderBy);

        // Pagination stuff
        const shouldFetchTotals =
            isLengthAware || currentPage === 1 || isFromStart;
        let pagination = {};
        let countQuery = null;

        const offset = isFromStart ? 0 : (currentPage - 1) * perPage;
        const limit = isFromStart ? perPage * currentPage : perPage;

        if (shouldFetchTotals) {
            countQuery = new this.constructor(this.client)
                .count('* as total')
                .from(
                    this.clone().offset(0).clearOrder().as('__count__query__')
                )
                .first()
                .debug(this._debug);
        }

        // This will paginate the data itself
        this.offset(offset).limit(limit);

        return this.client.transaction(async (trx) => {
            const result = await this.transacting(trx);

            if (shouldFetchTotals) {
                const { total } = await countQuery.transacting(trx);

                pagination = {
                    total: +total,
                    lastPage: Math.ceil(total / perPage),
                };
            }

            // Add pagination data to paginator object
            pagination = {
                ...pagination,
                perPage,
                currentPage,
                from: offset,
                to: offset + result.length,
            };

            return { data: result, pagination };
        });
    });
};
