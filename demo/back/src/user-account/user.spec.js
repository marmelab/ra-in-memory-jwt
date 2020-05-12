const { isValidUsername, isValidPassword } = require('./user');

describe('User methods', () => {
    describe('isValidUsername', () => {
        it.each([
            ['us'],
            ['usernameusernameusern'],
            ['user name'],
            ['user_name'],
            ['user&name'],
            ['user/name'],
        ])('%s should not be a valid username', (username) => {
            const testUsername = isValidUsername(username);
            expect(testUsername.isValid).toBeFalsy();
        });

        it.each([
            ['username'],
            ['user-name'],
            ['iser0name'],
            ['UserName'],
            ['userName-24'],
        ])('%s should be a valid username', (username) => {
            const testUsername = isValidUsername(username);
            expect(testUsername.isValid).toBeTruthy();
        });
    });

    describe('isValidPassword', () => {
        it.each([['password'], ['P===°hjkN']])(
            '%s should not be a valid password',
            (password) => {
                const testPassword = isValidPassword(password);
                expect(testPassword.isValid).toBeFalsy();
                expect(testPassword.error).toContain(
                    "Le mot de passe n'est pas valide"
                );
            }
        );

        it.each([['azertyazerty']])(
            '%s should not be a enough complex password',
            (password) => {
                const testPassword = isValidPassword(password);
                expect(testPassword.isValid).toBeFalsy();
                expect(testPassword.error).toContain(
                    "Le mot de passe n'est pas assez complexe"
                );
            }
        );

        it.each([['n33dToB3=Str0ng']])(
            '%s should not be a valid password',
            (password) => {
                const testPassword = isValidPassword(password);
                expect(testPassword.isValid).toBeTruthy();
            }
        );
    });
});
