import type { Collection } from "mongodb";
import type { User, UserModel } from "./types.ts";

export const fromModelToUser = async (
  userDB: UserModel,
  usersCollection: Collection<UserModel>
): Promise<User> => {
  const friends = await usersCollection
    .find({ _id: { $in: userDB.friends } })
    .toArray();
  return {
    id: userDB._id!.toString(),
    name: userDB.name,
    email: userDB.email,
    phone: userDB.phone,
    friends: friends.map((b) => fromModelToUser2(b)),
  };
};

export const fromModelToUser2 = (model: UserModel): User => ({
  id: model._id!.toString(),
  name: model.name,
  email: model.email,
  phone: model.phone,
  friends: model.friends
});