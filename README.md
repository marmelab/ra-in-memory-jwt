# ra-in-memory-jwt

 ![GitHub top language](https://img.shields.io/github/languages/top/marmelab/ra-in-memory-jwt.svg) ![GitHub contributors](https://img.shields.io/github/contributors/marmelab/ra-in-memory-jwt.svg) ![ra-in-memory-jwt.svg](https://img.shields.io/github/license/marmelab/ra-in-memory-jwt.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg) ![npm](https://img.shields.io/npm/v/ra-in-memory-jwt)

Probably by routine or by *Stack Overflow syndrome*, we often use a [JSON Web Token(JWT)](https://tools.ietf.org/html/rfc7519) to manage this authentication between our frontend apps and their API. For convenience, we store this token in the browser's [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). But this is not a good practice, as Randall Degges explains in his article ["Please Stop Using Local Storage"](https://dev.to/rdegges/please-stop-using-local-storage-1i04). For the most curious, here is an example of how ["Stealing JWTs in localStorage via XSS"](https://medium.com/redteam/stealing-jwts-in-localstorage-via-xss-6048d91378a0).

But then, how to use a JWT to manage authentication in a more secure way? `ra-in-memory-jwt` is an implementation of a solution proposed by the [Hasura](https://hasura.io) team in their article [The Ultimate Guide to handling JWTs on frontend clients](https://hasura.io/blog/best-practices-of-using-jwt-with-graphql/).

You can find a detailed explanation of this implementation on the blog post [Handling JWT in Admin Apps the Right Way](https://marmelab.com/blog/2020/07/02/manage-your-jwt-react-admin-authentication-in-memory.html).

## Installation

### From npm

```bash
npm install ra-in-memory-jwt
```

### From scratch

The use of `ra-in-memory-jwt` is strongly linked to your API. Rather than using the npm package and the configuration options (see next part), you will probably save time to recreate the `innMemoryJWT.js` file from the [original file](https://github.com/marmelab/ra-in-memory-jwt/blob/master/src/index.js). And it will be one less dependency for your project!

## Configuration

`ra-in-memory-jwt` must know the API endpoints to refresh the JWT. The default value is `/refresh-token`, but you can change it with the `setRefreshTokenEndpoint` method:

```javascript
inMemoryJWT.setRefreshTokenEndpoint('http://localhost:8001/another/refresh-token-endpoint');
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

To learn more about the contributions to this project, consult the [contribution guide](/.github/CONTRIBUTING.md).

## Maintainer

[![alexisjanvier](https://avatars1.githubusercontent.com/u/547706?s=96&amp;v=4)](https://github.com/alexisjanvier)     
[Alexis Janvier](https://github.com/alexisjanvier) 

## License

ra-in-memory-jwt is licensed under the [MIT License](LICENSE), courtesy of [Marmelab](http://marmelab.com).
