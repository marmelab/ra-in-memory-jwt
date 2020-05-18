import React from 'react';
import { Datagrid, TextField, DateField, ShowButton, ShowGuesser, List } from 'react-admin';
import UserIcon from '@material-ui/icons/People';

export const UserList = props => {
    return (<List {...props}>
        <Datagrid rowClick="edit">
            <TextField source="username" />
            <DateField source="createdAt" />
            <ShowButton />
        </Datagrid>
    </List>);
};

export default {
    icon: UserIcon,
    list: UserList,
    options: { label: 'Users' },
    show: ShowGuesser,
};
