import inMemoryJWT from './inMemoryJWT';

const authProvider = {
    login: ({ username, password }) => {
        const request = new Request('http://localhost:8001/authenticate', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
            credentials: 'include',
        });
        return fetch(request)
            .then((response) => {
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.statusText);
                }
                return response.json();
            })
            .then(({ token }) => inMemoryJWT.setToken(token));
    },
    logout: () => {
        inMemoryJWT.ereaseToken();
        return Promise.resolve();
    },

    checkAuth: () => {
        if (inMemoryJWT.getToken()) {
                return Promise.resolve();
        } else {
            return Promise.reject();
        }
    },

    checkError: (error) => {
        const status = error.status;
        if (status === 401 || status === 403) {
            inMemoryJWT.ereaseToken();
        }
        return Promise.resolve();
    },

    getPermissions: () => {
        if (inMemoryJWT.getToken()) {
            return Promise.resolve('ok');
        } else {
            return Promise.reject();
        }
    },
};

export default authProvider; 
