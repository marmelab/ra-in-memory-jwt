const { sortSanitizer } = require('./sort-helpers');

describe('Sort Helpers', () => {
    describe('sortSanitizer', () => {
        it('should return the first sortable field ASC if sortBy is not set', () => {
            const defaultSortableFields = ['foo', 'bar'];
            expect(
                sortSanitizer(
                    { sortBy: undefined, orderBy: 'DESC' },
                    defaultSortableFields
                )
            ).toEqual({ sortBy: 'foo', orderBy: 'ASC' });
        });

        it('should return the first sortable field ASC if orderBy is not set', () => {
            const defaultSortableFields = ['foo', 'bar'];
            expect(
                sortSanitizer(
                    { sortBy: 'bar', orderBy: undefined },
                    defaultSortableFields
                )
            ).toEqual({ sortBy: 'foo', orderBy: 'ASC' });
        });

        it('should return the first sortable field ASC if query sort is not a sortable field', () => {
            const defaultSortableFields = ['foo', 'bar'];
            expect(
                sortSanitizer(
                    { sortBy: 'notSortable', orderBy: 'DESC' },
                    defaultSortableFields
                )
            ).toEqual({ sortBy: 'foo', orderBy: 'ASC' });
        });

        it('should replace the sort order with ASC if the query param sort order is not valid', () => {
            const defaultSortableFields = ['foo', 'bar'];
            expect(
                sortSanitizer(
                    { sortBy: 'bar', orderBy: 'horizontal' },
                    defaultSortableFields
                )
            ).toEqual({ sortBy: 'bar', orderBy: 'ASC' });
        });

        it('should remove the supernumerary parameters of the sort object', () => {
            const defaultSortableFields = ['foo', 'bar'];
            expect(
                sortSanitizer(
                    { sortBy: 'bar', orderBy: 'DESC', nonsense: 'this' },
                    defaultSortableFields
                )
            ).toEqual({ sortBy: 'bar', orderBy: 'DESC' });
        });

        it('should return a well formated sort from query parameter', () => {
            const defaultSortableFields = ['foo', 'bar'];
            expect(
                sortSanitizer(
                    { sortBy: 'bar', orderBy: 'DESC' },
                    defaultSortableFields
                )
            ).toEqual({ sortBy: 'bar', orderBy: 'DESC' });
        });
    });
});
