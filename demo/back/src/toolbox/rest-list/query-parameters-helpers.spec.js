const { formatQueryParameters } = require('./query-parameters-helpers');

describe('Query Parameters Helpers', () => {
    describe('formatQueryParameters', () => {
        it('should return an empty object of filters, null sort and default pagination without query params', () => {
            expect(formatQueryParameters()).toEqual({
                filters: {},
                sort: null,
                pagination: { currentPage: 1, perPage: 10 },
            });
        });

        it('should split query params into filters, sort and pagination props', () => {
            expect(
                formatQueryParameters({
                    sortBy: 'name',
                    orderBy: 'DESC',
                    perPage: 10,
                    currentPage: 3,
                    age: 'gte:40',
                })
            ).toEqual({
                filters: { age: 'gte:40' },
                sort: { sortBy: 'name', orderBy: 'DESC' },
                pagination: { currentPage: 3, perPage: 10 },
            });
        });
    });
});
