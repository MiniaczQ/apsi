import Role from './Role';

export type UserWithRoles = {
  userId: string;
  username: string;
  roles: Role[];
};

export default UserWithRoles;
