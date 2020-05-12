const {
    paginationSanitizer,
    formatPaginationToLinkHeader,
} = require('./pagination-helpers');

describe('Pagination Helpers', () => {
    describe('paginationSanitizer', () => {
        it('should return string pagination params as integer if it possible', () => {
            expect(
                paginationSanitizer({ perPage: '12', currentPage: '2' })
            ).toEqual({ perPage: 12, currentPage: 2 });
        });

        it('should return default pagination if pagination array is empty', () => {
            expect(paginationSanitizer({})).toEqual({
                perPage: 10,
                currentPage: 1,
            });
        });

        it('should return default pagination if one of pagination params could not be cast as integer', () => {
            expect(
                paginationSanitizer({ perPage: 'douze', currentPage: '2' })
            ).toEqual({ perPage: 10, currentPage: 2 });
            expect(
                paginationSanitizer({ perPage: '12', currentPage: 'deux' })
            ).toEqual({ perPage: 12, currentPage: 1 });
            expect(
                paginationSanitizer({ perPage: {}, currentPage: '2' })
            ).toEqual({ perPage: 10, currentPage: 2 });
            expect(
                paginationSanitizer({ perPage: null, currentPage: '2' })
            ).toEqual({ perPage: 10, currentPage: 2 });
        });

        it('should remove the supernumerary parameters of the pagination array', () => {
            expect(
                paginationSanitizer({
                    perPage: 22,
                    currentPage: 3,
                    notPage: 'foo',
                    isPage: 'bar',
                })
            ).toEqual({ perPage: 22, currentPage: 3 });
        });

        it('should not accept negative value for perPage params', () => {
            expect(
                paginationSanitizer({
                    perPage: -6,
                    currentPage: 3,
                })
            ).toEqual({ perPage: 10, currentPage: 3 });
        });

        it('should not accept negative value for currentPage params', () => {
            expect(
                paginationSanitizer({
                    perPage: 6,
                    currentPage: -2,
                })
            ).toEqual({ perPage: 6, currentPage: 1 });
        });
    });
    describe('formatPaginationToLinkHeader', () => {
        it('should contain all pagination elements', () => {
            expect(
                formatPaginationToLinkHeader({
                    resourceURI: '/api/resources',
                    pagination: {
                        currentPage: 3,
                        perPage: 10,
                        lastPage: 5,
                    },
                })
            ).toEqual(
                [
                    '</api/resources?currentPage=1&perPage=10>; rel="first"',
                    '</api/resources?currentPage=2&perPage=10>; rel="prev"',
                    '</api/resources?currentPage=3&perPage=10>; rel="self"',
                    '</api/resources?currentPage=4&perPage=10>; rel="next"',
                    '</api/resources?currentPage=5&perPage=10>; rel="last"',
                ].join(',')
            );
        });

        it('should have same first, prev and self elements', () => {
            expect(
                formatPaginationToLinkHeader({
                    resourceURI: '/api/resources',
                    pagination: {
                        currentPage: 1,
                        perPage: 10,
                        lastPage: 3,
                    },
                })
            ).toEqual(
                [
                    '</api/resources?currentPage=1&perPage=10>; rel="first"',
                    '</api/resources?currentPage=1&perPage=10>; rel="prev"',
                    '</api/resources?currentPage=1&perPage=10>; rel="self"',
                    '</api/resources?currentPage=2&perPage=10>; rel="next"',
                    '</api/resources?currentPage=3&perPage=10>; rel="last"',
                ].join(',')
            );
        });

        it('should have same self, next and last elements', () => {
            expect(
                formatPaginationToLinkHeader({
                    resourceURI: '/api/resources',
                    pagination: {
                        currentPage: 3,
                        perPage: 10,
                        lastPage: 3,
                    },
                })
            ).toEqual(
                [
                    '</api/resources?currentPage=1&perPage=10>; rel="first"',
                    '</api/resources?currentPage=2&perPage=10>; rel="prev"',
                    '</api/resources?currentPage=3&perPage=10>; rel="self"',
                    '</api/resources?currentPage=3&perPage=10>; rel="next"',
                    '</api/resources?currentPage=3&perPage=10>; rel="last"',
                ].join(',')
            );
        });

        it('should have same first, prev, self, next and last elements', () => {
            expect(
                formatPaginationToLinkHeader({
                    resourceURI: '/api/resources',
                    pagination: {
                        currentPage: 1,
                        perPage: 10,
                        lastPage: 1,
                    },
                })
            ).toEqual(
                [
                    '</api/resources?currentPage=1&perPage=10>; rel="first"',
                    '</api/resources?currentPage=1&perPage=10>; rel="prev"',
                    '</api/resources?currentPage=1&perPage=10>; rel="self"',
                    '</api/resources?currentPage=1&perPage=10>; rel="next"',
                    '</api/resources?currentPage=1&perPage=10>; rel="last"',
                ].join(',')
            );
        });

        it('should contain return null if any element is missing', () => {
            expect(
                formatPaginationToLinkHeader({
                    resourceURI: '/api/resources',
                    pagination: {
                        currentPage: 3,
                        perPage: 10,
                    },
                })
            ).toBeNull();
            expect(
                formatPaginationToLinkHeader({
                    resourceURI: '/api/resources',
                    pagination: {
                        currentPage: 3,
                        lastPage: 5,
                    },
                })
            ).toBeNull();
            expect(
                formatPaginationToLinkHeader({
                    pagination: {
                        currentPage: 3,
                        lastPage: 5,
                    },
                })
            ).toBeNull();
            expect(
                formatPaginationToLinkHeader({
                    resourceURI: '/api/resources',
                })
            ).toBeNull();
        });
    });
});
