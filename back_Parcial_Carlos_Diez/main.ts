import { MongoClient, ObjectId } from "mongodb";
import type {UserModel } from "./types.ts";
import { fromModelToUser2, fromModelToUser } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) {
  console.error("MONGO_URL is not set");
  Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Connected to MongoDB");

const db = client.db("Usuarios");

const usersCollection = db.collection<UserModel>("users");

const handler = async (req: Request): Promise<Response> => {
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;
  if (method === "GET") {
    if (path === "/users") {
      const name = url.searchParams.get("name");
      if (name) {
        const usersDB = await usersCollection.find({ name }).toArray();
        const users = await Promise.all(
          usersDB.map((u) => fromModelToUser2(u))
        );
        return new Response(JSON.stringify(users));
      } else {
        const usersDB = await usersCollection.find().toArray();
        const users = await Promise.all(
          usersDB.map((u) => fromModelToUser2(u))
        );
        return new Response(JSON.stringify(users));
      }
    } else if (path === "/user") {
      const email = url.searchParams.get("email");
      if (!email) return new Response("Bad request", { status: 400 });
      const userDB = await usersCollection.findOne({
        email,
      });
      if (!userDB) return new Response("User not found", { status: 404 });
      const user = await fromModelToUser2(userDB);
      return new Response(JSON.stringify(user));
    }
  } else if (method === "POST") {
    if (path === "/user") {
      const user = await req.json();
      if (!user.name || !user.email || !user.phone) {
        return new Response("Bad request", { status: 400 });
      }
      const userDB = await usersCollection.findOne({
        email: user.email,
      });
      if (userDB) return new Response("User already exists", { status: 409 });
      const { insertedId } = await usersCollection.insertOne({
        name: user.name,
        email: user.email,
        phone: user.phone,
        friends: [],
      });
      return new Response(
        JSON.stringify({
          name: user.name,
          email: user.email,
          phone: user.phone,
          friends: [],
          id: insertedId,
        }),
        { status: 201 }
      );
    } 
  } else if (method === "PUT") {
    if (path === "/user") {
      const user = await req.json();
      if (!user.name || !user.email || !user.phone || !user.friends) {
        return new Response("Bad request", { status: 400 });
      }
      if (user.friends) {
        const friends = await usersCollection
          .find({
            _id: { $in: user.friends.map((id: string) => new ObjectId(id)) },
          })
          .toArray();
        if (friends.length !== user.books.length) {
          return new Response("Book not found", { status: 404 });
        }
      }
      const { modifiedCount } = await usersCollection.updateOne(
        { email: user.email },
        { $set: { name: user.name, phone: user.phone, friends: user.friends } }
      );
      if (modifiedCount === 0) {
        return new Response("User not found", { status: 404 });
      }
      return new Response("OK", { status: 200 });
    } 
  } else if (method === "DELETE") {
    if (path === "/user") {
      const id = url.searchParams.get("id");
      if (!id) return new Response("Bad request", { status: 400 });
      const { deletedCount } = await usersCollection.deleteOne({
        _id: new ObjectId(id),
      });
      if (deletedCount === 0) {
        return new Response("User not found", { status: 404 });
      }
      return new Response("OK", { status: 200 });
    } 
  }
  return new Response("endpoint not found", { status: 404 });
};
Deno.serve({ port: 3000 }, handler);