const { filtersSanitizer } = require('./filters-helpers');

describe('Filters Helpers', () => {
    describe('filtersSanitizer', () => {
        it('should return an empty array if query filters are not set', () => {
            const defaultFilterableFields = ['foo', 'bar'];
            expect(
                filtersSanitizer(undefined, defaultFilterableFields)
            ).toEqual([]);
        });

        it('should remove all unfiltrable fields from query parameters', () => {
            const defaultFilterableFields = ['foo', 'bar'];
            expect(
                filtersSanitizer(
                    { unfiltrable: 'yes' },
                    defaultFilterableFields
                )
            ).toEqual([]);
        });

        it('should return valid filter from query parameters, with default operator eq', () => {
            const defaultFilterableFields = ['foo', 'bar'];
            expect(
                filtersSanitizer({ foo: 'yes' }, defaultFilterableFields)
            ).toEqual([{ name: 'foo', value: 'yes', operator: 'eq' }]);
        });

        it('should return valid filter from query parameters, with properly parsed operator', () => {
            const defaultFilterableFields = ['foo', 'bar'];
            expect(
                filtersSanitizer(
                    { foo: '2020-05-02:gte' },
                    defaultFilterableFields
                )
            ).toEqual([{ name: 'foo', value: '2020-05-02', operator: 'gte' }]);
        });

        it('should take several query parameters', () => {
            const defaultFilterableFields = ['foo', 'bar'];
            expect(
                filtersSanitizer(
                    { foo: 'yes', bar: 'no' },
                    defaultFilterableFields
                )
            ).toEqual([
                { name: 'foo', value: 'yes', operator: 'eq' },
                { name: 'bar', value: 'no', operator: 'eq' },
            ]);
        });

        it('should return valid filter and remove unfiltrable from query parameters', () => {
            const defaultFilterableFields = ['foo', 'bar'];
            expect(
                filtersSanitizer(
                    { bar: 'yes', unfiltrable: 'yes' },
                    defaultFilterableFields
                )
            ).toEqual([{ name: 'bar', value: 'yes', operator: 'eq' }]);
        });

        it('should remove empty valid filters from query parameters', () => {
            const defaultFilterableFields = ['foo', 'bar'];
            expect(
                filtersSanitizer(
                    { foo: 'yes', bar: '   ' },
                    defaultFilterableFields
                )
            ).toEqual([{ name: 'foo', value: 'yes', operator: 'eq' }]);
        });

        it('should not remove null valid filters from query parameters', () => {
            const defaultFilterableFields = ['foo', 'bar'];
            expect(
                filtersSanitizer(
                    { foo: 'yes', bar: null },
                    defaultFilterableFields
                )
            ).toEqual([
                { name: 'foo', value: 'yes', operator: 'eq' },
                { name: 'bar', value: null, operator: 'eq' },
            ]);
        });

        it('should remove undefined valid filters from query parameters', () => {
            const defaultFilterableFields = ['foo', 'bar'];
            expect(
                filtersSanitizer(
                    { foo: 'yes', bar: undefined },
                    defaultFilterableFields
                )
            ).toEqual([{ name: 'foo', value: 'yes', operator: 'eq' }]);
        });
    });
});
