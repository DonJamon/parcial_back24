import { ObjectId, type OptionalId } from "mongodb";

export type UserModel = OptionalId<{
  name: string;
  email: string;
  phone: string;
  friends: ObjectId[];
}>;

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  friends: User[];
};