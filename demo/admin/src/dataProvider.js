import { stringify } from 'query-string';
import { fetchUtils } from 'ra-core';

import inMemoryJWT from './inMemoryJWT';

const getXTotalCountHeaderValue = (headers) => {
    if (!headers.has('x-total-count')) {
        throw new Error(
            'The X-Total-Count header is missing in the HTTP Response.'
        );
    }

    return parseInt(headers.get('x-total-count'), 10);
};

const formatFilters = (filters) => {
    return Object.keys(filters).reduce((acc, filterKey) => {
        const [name, operator = 'eq'] = filterKey.split(':');
        return {
            ...acc,
            [name]: `${filters[filterKey]}:${operator}`,
        };
    }, {});
};

export default (apiUrl) => {
    const httpClient = (url) => {
        const options = {
            headers: new Headers({ Accept: 'application/json' }),
        };
        const token = inMemoryJWT.getToken();

        if (token) {
            options.headers.set('Authorization', `Bearer ${token}`);
            return fetchUtils.fetchJson(url, options);
        } else {
            inMemoryJWT.setRefreshTokenEndpoint('http://localhost:8001/refresh-token');
            return inMemoryJWT.getRefreshedToken().then((gotFreshToken) => {
                if (gotFreshToken) {
                    options.headers.set('Authorization', `Bearer ${inMemoryJWT.getToken()}`);
                };
                return fetchUtils.fetchJson(url, options);
            });
        }
    };

    return {
        getList: (resource, params) => {
            const { page: currentPage, perPage } = params.pagination;
            const { field, order } = params.sort;
            const filters = params.filter;
            const query = {
                sortBy: field,
                orderBy: order,
                currentPage,
                perPage,
                ...formatFilters(filters),
            };
            const url = `${apiUrl}/${resource}?${stringify(query)}`;

            return httpClient(url).then(({ headers, json }) => {
                return {
                    data: json,
                    total: getXTotalCountHeaderValue(headers),
                };
            });
        },

        getOne: (resource, params) =>
            httpClient(`${apiUrl}/${resource}/${params.id}`).then(({ json }) => ({
                data: json,
            })),

        getMany: (resource, params) => {
            const filters = params.filter;
            const query = {
                sortBy: 'id',
                currentPage: 1,
                perPage: 100,
                ...formatFilters(filters),
            };
            const url = `${apiUrl}/${resource}?${stringify(query)}`;

            return httpClient(url).then(({ headers, json }) => {
                return {
                    data: json,
                    total: getXTotalCountHeaderValue(headers),
                };
            });
        },

        getManyReference: (resource, params) => {
            const filters = params.filter;
            const query = {
                sortBy: 'id',
                currentPage: 1,
                perPage: 100,
                ...formatFilters(filters),
            };
            const url = `${apiUrl}/${resource}?${stringify(query)}`;

            return httpClient(url).then(({ headers, json }) => {
                return {
                    data: json,
                    total: getXTotalCountHeaderValue(headers),
                };
            });
        },

        update: () => Promise.reject(),
        updateMany: () => Promise.reject(),
        create: () => Promise.reject(),
        delete: () => Promise.reject(),
        deleteMany: () => Promise.reject(),
    };
};
