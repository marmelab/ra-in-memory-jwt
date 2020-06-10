Afin de sécuriser au mieux l'authentification de React-admin, voyons comment stocker un Json Web Token en mémoire plutôt que dans le localStorage du navigateur.

React-admin s'appuie sur un très efficace [authProvider](https://marmelab.com/react-admin/Authentication.html) pour gérer l'authentification. Et sans doute par habitude ou mimétisme, on utilise souvent sur un [JSON Web Token(JWT)](https://tools.ietf.org/html/rfc7519) pour transmettre cette authentification entre React-admin et l'API, JWT que l'on stock ensuite par commodité dans le [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) du navigateur. Mais ce n'est pourtant pas une bonne pratique, comme l'explique par exemple Randall Degges dans son article ["Please Stop Using Local Storage "](https://dev.to/rdegges/please-stop-using-local-storage-1i04). Et pour le plus curieux, voici par exemple comment ["Stealing JWTs in localStorage via XSS"](https://medium.com/redteam/stealing-jwts-in-localstorage-via-xss-6048d91378a0).

Mais alors comment utiliser un JWT pour gérer son authentification React-admin de manière plus sécurisée ? Ce post de blog va illustrer une implémentation du principe proposé par l'équipe d'[Hasura](https://hasura.io) dans leur article [The Ultimate Guide to handling JWTs on frontend clients](https://hasura.io/blog/best-practices-of-using-jwt-with-graphql/). Ce principe consiste "tout simplement" à stocker ce jeton en mémoire. Ce qui n'est pas si simple en fait !

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

## Le problème des onglets

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
            getRefreshedToken,
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
    const getRefreshedToken = () => {
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

Le mécanisme que l'on vient de voir permet donc de ne pas nous déconnecter à la fin de la durée de vie du JWT. Pour autant, il ne permet pas de maintenir une session, par exemple si l'on rafraichie la page ! 

Pour parvenir à ce resultat, il devrait suffir de faire un call au endpoint `/refresh-token` lorsque l'on test les droits de l'utilisateur (le `checkAuth` de l'`authProvider`):

```javascript
//in authProvider.js
//...
    checkAuth: () => {
        console.log('checkAuth');
        if (!inMemoryJWT.getToken()) {
            inMemoryJWT.setRefreshTokenEndpoint('http://localhost:8001/refresh-token');
            return inMemoryJWT.getRefreshedToken().then(tokenHasBeenRefreshed => {
                return tokenHasBeenRefreshed ? Promise.resolve() : Promise.reject();
            });
        } else {
            return Promise.resolve();
        }
    },
```

Alors, cette solution marche, mais elle n'est pas forcement satisafaisante :

screen gif

En effet, React-admin, pour des raison d'optimistique rendering, va lancer le call à la liste avant le retour de la promesse de checkAuth. Du coup, ce call se fera sans JWT, avec un retour en 403, et donc un checkError qui va rediriger vers le login (après un logout, ce qui nous le verrons dans la partie suivante posserait problème !).

Plusieur solution sont possible pour resoudre ce problème, en fonction de votre besoin. En effet, on pourrait imaginer que certaine route n'ai pas besoin de jeton JWT, comme les listes. Pour notre exemple, on considère que ce n'est pas le cas, et que toute les routes nécessitent une authentification (ce qu ine présage pas que l'on ait les droits sur toutes les routes d'ailleur, mais le jwt pourra justement porter les informations concernant ces droits !).

Toutes les routes ayant besoin d'un token pour fonctionner, nous allons donc implémenter l'appel à la route `refresh-token` directement au niveau du client http :

```javascript
// in dataProvider

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

```

Cela resoud notre premier problème d'appel à la liste qui renvoyait une 403. Mais cela provoque un second problème : le `checkAuth` n'ayant pas de token, cela va aussi provoqué un logout et une redirection vers le login. La solution va conister à demander au checkAuth d'attentre la fin de la requête au `refresh-token` avant de retourner sa réponse. Et pour cela, on implémenter une methode `waitForTokenRefresh` au niveau du `inMemoryJWTManager`. Cette methode retourne une promesse resolue si aucun call vers le refresh token n'est en cours. Si un call est en cours, elle attent la resolution de ce call avant de renvoyer la resolution.

```javascript
// in inMemoryJWTManager

const inMemoryJWTManager = () => {
    ...
    let isRefreshing = null;

    ...

    const waitForTokenRefresh = () => {
        if (!isRefreshing) {
            return Promise.resolve();
        }
        return isRefreshing.then(() => {
            isRefreshing = null;
            return true;
        });
    }

    const getRefreshedToken = () => {
        const request = new Request(refreshEndpoint, {
            method: 'GET',
            headers: new Headers({ 'Content-Type': 'application/json' }),
            credentials: 'include',
        });

        isRefreshing = fetch(request)
            .then((response) => {
                if (response.status !== 200) {
                    ereaseToken();
                    global.console.log(
                        'Token renewal failure'
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
                ereaseToken();
                return false;
            });

        return isRefreshing;
    };

    ...
};
```

En fait, cette methode `waitForTokenRefresh` car elle va nous permettre d'attendre la fin des appel au refresh de token à different endroit de notre application React-admin, et donc de s'adapter à notre besoin. Ici, notre besoin consite donc à attentre la fin d'un potentiel appel au `refresh-token` lancer par le dataProvider dans le cas ou l'utilisatur ne serait pas authentifier, soit :

```javascript
// in authProvider.js
    ...

    checkAuth: () => {
        return inMemoryJWT.waitForTokenRefresh().then(() => {
            return inMemoryJWT.getToken() ? Promise.resolve() : Promise.reject();
        });
    },

    ...

    getPermissions: () => {
        return inMemoryJWT.waitForTokenRefresh().then(() => {
            return inMemoryJWT.getToken() ? Promise.resolve() : Promise.reject();
        });
    },
```

## La déconnexion

Le dernier point à adresser touche à la déconnexion. En effet, avec notre nouveau mécanisme, la deconnexion marche pour le session courante. Mais dès que l'on recharge la page, nous somme de nouveau connecter ! Pour la seul solution consiste à appeller un endpoint de déconnexion de l'API, car seul l'API pourra invalider le cookie de rafraishissement ! (du moins proprement si vous avez implementer de la logique sur le cookies de rafraichissement côté back).

```javascript
// in authProvider.js

    logout: () => {
        const request = new Request('http://localhost:8001/logout', {
            method: 'GET',
            headers: new Headers({ 'Content-Type': 'application/json' }),
            credentials: 'include',
        });
        inMemoryJWT.ereaseToken();

        return fetch(request).then(() => '/login');
    },
```

## Conclusion

Ca marche bien ! Cela devrait être bien sécurisé ! Possibiliter de doubler cela avec d'autre tactiques (cf post de blog de françois)

Beaucoup plus complexités côté front, mais aussi coté back. 

Question : bonne idée d'utiliser un JWT pour une simple authentification ? Juste un cookie, et une verification des droits basc depuis le cookie ? Cela mérite de se poser la question, et ne pas considérer de facto le JWT comme la solution standard à utiliser !