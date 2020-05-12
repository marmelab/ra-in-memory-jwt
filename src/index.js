const inMemoryJWTManager = () => {
    let inMemoryJWT = null;

    const setToken = (token) => {
        inMemoryJWT = token;
    };

    return {
        getToken: () => inMemoryJWT,
        setToken,
    }
};

export default inMemoryJWTManager();