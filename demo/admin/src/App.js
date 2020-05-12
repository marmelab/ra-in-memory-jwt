import React from 'react';
import { Admin, Resource } from 'react-admin';

import dataDemoProvider from './dataProvider';
import usersConfiguration from './users';

const dataProvider = dataDemoProvider('http://localhost:8001/api');
const App = () => (
    <Admin dataProvider={dataProvider}>
        <Resource name="users" {...usersConfiguration} />
    </Admin>
);


export default App;
