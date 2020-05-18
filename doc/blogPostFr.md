On utilise très régulièrement les [JSON Web Token(JWT)](https://tools.ietf.org/html/rfc7519) pour gérer l'authentification des utilisateurs. Et c'est par exemple la manière dont est illustrer l'authentification dans la documentation de React-admin.

Mais dans cette exemple, le JWT est stocker dans le locale storage. Ce qui pour certain est considérer comme une très mauvaise pratique !

[How to securely store JWT tokens.](https://dev.to/gkoniaris/how-to-securely-store-jwt-tokens-51cf)


Cette article illustre l'implementation décrit dans le post de blog [The Ultimate Guide to handling JWTs on frontend clients](https://hasura.io/blog/best-practices-of-using-jwt-with-graphql/) qui consiste à ne plus stocker le JWT dans le local storage, mais en mémoire. Ce qui n'est pas fait pour simpleifier une implémentation user friendly !

Ce qu'il faut retenir de cette implementation, c'est que l'on considère que la meilleur manière de conserver le JWT côté client est de la conserver en mémoire. C'est ainsi qu'on minimisera au maximum le vol potentiel de ce jeton, jeton qui aura au demeurant une durée de vie assez courte (10 min). Mais pour pallier aux inconveniants de ne le maintenir qu'en mémoire (on perd le jeton en rafraichissant la page par exemple !), on va implémenter un mécanisme permettant de renouveller ce jeton en se basant sur un endpoint (`/refresh-token`) qui utilisera un cookie qui lui sera sécurisé. La table `refresh_token` est la table utilisée pour gérer ces jetons de rafraichissement de JWT.

## Première mise en place

On considère donc que l'on a une API possédant une route s'authentification qui en cas de succès retournera un JWT. Voici un exemple d'une tel implementation avec [Koa](https://koajs.com/) et  [node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken#readme) :

```javascript
router.post('/authenticate', async (ctx) => {
    const { username, password } = ctx.request.body;

    const user = await getOneByUsername(username);

    if (!user || user.error) {
        ctx.throw(401, user ? user.error : 'Invalid credentials.');
        return;
    }

    if (!bcrypt.compareSync(password, user.password)) {
        ctx.throw(401, 'Invalid credentials.');
        return;
    }

    const token = jwt.sign({ username }, config.security.jwt.secretkey, {
        expiresIn: config.security.jwt.expiration,
    });

    ctx.body = { token };
});

```

Et voici une première version de `ra-in-memory-jwt` qui va nous servir à stocker le jeton post authentification, en mémoire, et non plus dans le local storage :

```javascript
// inMemoryJwt.js
const inMemoryJWTManager = () => {
    let inMemoryJWT = null;

    const getToken = () => inMemoryJWT;

    const setToken = (token) => {
        inMemoryJWT = token;
        return true;
    };

    const ereaseToken = () => {
        inMemoryJWT = null;
        return true;
    }

    return {
        ereaseToken,
        getToken,
        setToken,
    }
};

export default inMemoryJWTManager();
```

Et voici son implementation dans une application react-admin basique :

l'application principale :

```javascript
// App.js
import React from 'react';
import { Admin, Resource } from 'react-admin';

import myDataProvider from './dataProvider';
import authProvider from './authProvider';
import usersConfiguration from './users';

const dataProvider = myDataProvider('http://localhost:8001/api');
const App = () => (
    <Admin authProvider={authProvider} dataProvider={dataProvider}>
        <Resource name="users" {...usersConfiguration} />
    </Admin>
);

export default App;
```

La gestion de l'authentification :

```javascript
// in authProvider.js
import inMemoryJWT from 'ra-in-memory-jwt';

const authProvider = {
    login: ({ username, password }) => {
        const request = new Request('http://localhost:8001/authenticate', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: new Headers({ 'Content-Type': 'application/json' })
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
        return inMemoryJWT.getToken() ? Promise.resolve() : Promise.reject();
    },

    checkError: (error) => {
        const status = error.status;
        if (status === 401 || status === 403) {
            inMemoryJWT.ereaseToken();
            return Promise.reject();
        }
        return Promise.resolve();
    },

    getPermissions: () => {
        return inMemoryJWT.getToken() ? Promise.resolve() : Promise.reject();
    },
};

export default authProvider;
```

La gestion des appels à l'API

```javascript
// in dataProvider.js
import { fetchUtils } from 'ra-core';
import inMemoryJWT from 'ra-in-memory-jwt';

export default (apiUrl) => {
    const httpClient = (url) => {
        const options = {
            headers: new Headers({ Accept: 'application/json' }),
        };
        const token = inMemoryJWT.getToken();
        if (token) {
            options.headers.set('Authorization', `Bearer ${token}`);
        }

        return fetchUtils.fetchJson(url, options);
    };

    return {
        getList: (resource, params) => {
            const url = `${apiUrl}/${resource}`;
            return httpClient(url).then(({ headers, json }) => {
                return {
                    data: json,
                    total: headers.get('x-total-count'),
                };
            });
        },
        getOne: (resource, params) =>
            httpClient(`${apiUrl}/${resource}/${params.id}`).then(({ json }) => ({
                data: json,
            })),
        getMany: () => Promise.reject(),
        getManyReference: () => Promise.reject(),
        update: () => Promise.reject(),
        updateMany: () => Promise.reject(),
        create: () => Promise.reject(),
        delete: () => Promise.reject(),
        deleteMany: () => Promise.reject(),
    };
};
```

Cela marche très bien. C'est très securisé, on ne voit pas le JWT dans le local storage. Mais l'experience utilisateur n'est pas extraordinaire !

Par exemple, lorsque l'on refresh la page :

![Lorsque l'on recharge la page](raInMemoryJwtRefresh.gif)

Ou bien lorsque l'on se déconnecte d'un tab alors que l'on est aussi connecter sur une seconde :

![Connexion deux tabs](raInMemoryJwtTwoTabs.gif)

## Le problème des deux tabs

Lorsque le JWT est stocké dans le local storage, deux session de react admin lancé dans deux tab du navigateur vont pouvoir se partager se JWT. Et lorsque l'on se deconnecte, la suppression du JWT dans la locale storage va donc impacter les deux tabs. Ce n'est plus la cas lorsque le JWT est stocker en mémoire. La solution proposer dans l'article [The Ultimate Guide to handling JWTs on frontend clients](https://hasura.io/blog/best-practices-of-using-jwt-with-graphql/) est assez maligne, et passe par ... le local storage :)

```javascript
// inMemoryJwt.js
const inMemoryJWTManager = () => {
    let inMemoryJWT = null;

    // This listener will allow to disconnect a session of ra started in another tab
    window.addEventListener('storage', (event) => {
        if (event.key === 'ra-logout') {
            inMemoryJWT = null;
        }
    });

    const getToken = () => inMemoryJWT;

    const setToken = (token) => {
        inMemoryJWT = token;
        return true;
    };

    const ereaseToken = () => {
        inMemoryJWT = null;
        window.localStorage.setItem('ra-logout', Date.now());
        return true;
    }

    return {
        ereaseToken,
        getToken,
        setToken,
    }
};

export default inMemoryJWTManager();
```

Ainsi, lorsque l'utilisateur se déconnecte depuis une tab, il génère un évenement sur l'item `ra-logout` du locale storage, évènement écouté par toutes les instances de `inMemoryJWT`.

## Gérer une session sur un durée de vie plus longue que celle du token

L'idée directrice est d'avoir des token ayany un durée de vie limitée. Disons 5 min. Même si l'utilisateur ne recherche pas sa page, la session cessera lorsque le token ne sera plus valide. Comment étendre cette durée de session ? Et bien avec un token ! Mais ici, nous utiliserons un token très securisé (https only, same domain, etc) qui va nous permettre d'obtenir un nouveau token avant que le token courant ne soit périmé !

Cela va tout d'abord nécessité du code supplémentaire coté back pour :

1. Recevoir en plus du token sa durée de vie lors de la connexion. Nous pourrions le faire en décodant le token coté front, mais cela implique une complexité inutile !
2. De poser un token `refresh-token` lors de la connexion
   
En effet, ce token va nous permettre d'interroger une nouvelle route à mettre en place côté API : la route `/refresh-token`. Lorsque le front va interroger cette route, et dans le cas ou le `refresh-token` est valide, ce endpoint va renvoyer un nouveau token qui pourra remplacer en memoire le token périmé.

Je ne détaille pas ici le détail de l'implémentation côté API, mais vous pourrez trouver un exemple d'implémentation dans la demo du projet.

Mais voyons comment cela va fonctionner côté React-admin.

```javascript
const inMemoryJWTManager = () => {
    let logoutEventName = 'ra-logout';
    let refreshEndpoint = '/refresh-token';
    let inMemoryJWT = null;
    let refreshTimeOutId;

    // This listener will allow to disconnect a session of ra started in another tab
    window.addEventListener('storage', (event) => {
        if (event.key === logoutEventName) {
            inMemoryJWT = null;
        }
    });

    const setRefreshTokenEndpoint = endpoint => refreshEndpoint = endpoint;

    // This countdown feature is used to renew the JWT in a way that is transparent to the user.
    // before it's no longer valid
    const refreshToken = (delay) => {
        refreshTimeOutId = window.setTimeout(
            getRefreshedJWT,
            delay * 1000 - 5000
        ); // Validity period of the token in seconds, minus 5 seconds
    };

    const abordRefreshToken = () => {
        if (refreshTimeOutId) {
            window.clearTimeout(refreshTimeOutId);
        }
    };

    // The method make a call to the refresh-token endpoint
    // If there is a valid cookie, the endpoint will return a fresh jwt.
    const getRefreshedJWT = () => {
        const request = new Request(refreshEndpoint, {
            method: 'GET',
            headers: new Headers({ 'Content-Type': 'application/json' }),
            credentials: 'include',
        });
        return fetch(request)
            .then((response) => {
                if (response.status !== 200) {
                    ereaseToken();
                    global.console.log(
                        'Failed to renew the jwt from the refresh token.'
                    );
                    return { token: null };
                }
                return response.json();
            })
            .then(({ token, tokenExpiry }) => {
                if (token) {
                    setToken(token, tokenExpiry);
                    return true;
                }

                return false;
            });
    };


    const getToken = () => inMemoryJWT;

    const setToken = (token, delay) => {
        inMemoryJWT = token;
        refreshToken(delay);
        return true;
    };

    const ereaseToken = () => {
        inMemoryJWT = null;
        abordRefreshToken();
        window.localStorage.setItem(logoutEventName, Date.now());
        return true;
    }

    const setLogoutEventName = name => logoutEventName = name;

    return {
        ereaseToken,
        getToken,
        setLogoutEventName,
        setRefreshTokenEndpoint,
        setToken,
    }
};

export default inMemoryJWTManager();
```

```javascript
//in authProvider.js
//...
const authProvider = {
    login: ({ username, password }) => {
        const request = new Request('http://localhost:8001/authenticate', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
            credentials: 'include',
        });
        inMemoryJWT.setRefreshTokenEndpoint('http://localhost:8001/refresh-token');
        return fetch(request)
            .then((response) => {
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.statusText);
                }
                return response.json();
            })
            .then(({ token, tokenExpiry }) => inMemoryJWT.setToken(token, tokenExpiry));
    },
//...
```

L'idée est donc assez simple : on recupère la durée de vie en même temps que le token, et on lance un compte-à-rebour (timeout) sur la fonction qui va appeller le endpoint refresh token 5 seconde avant le péromption du token. Cette route de refresh fonctionnera aussi longtemps que le token créé lors du login sera valide. C'est donc ce token qui determinera la durée d'une session de connexion.

![Rafraichissement du jeton](refreshToken.gif)

## La session

Le mécanisme que l'on vient de voir permet donc de ne pas nous déconnecter à la fin de la durée de vie du JWT. Pour autant, il ne permet pas de maintenir une session, par exemple si l'on rafraichie la page ! Pour parvenir à ce resultat, il nous suffit en fait de faire un call au endpoint `/refresh-token` lorsque l'on test les droits de l'utilisateur (le `checkAuth` de l'`authProvider`):

```javascript
//in authProvider.js
//...
    checkAuth: () => {
        console.log('checkAuth');
        if (!inMemoryJWT.getToken()) {
            inMemoryJWT.setRefreshTokenEndpoint('http://localhost:8001/refresh-token');
            return inMemoryJWT.getRefreshedJWT().then(tokenHasBeenRefreshed => {
                return tokenHasBeenRefreshed ? Promise.resolve() : Promise.reject();
            });
        } else {
            return Promise.resolve();
        }
    },
```

## La déconnexion

## Dernier détail

## Conclusion

Beaucoup plus complexités côté front, mais aussi surtout coté back. A voir selon la criticité de vos JWT - et éventuellement du bien fonfé d'utilisé un JWT pour votre authentification ra.