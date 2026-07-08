import { MongoClient, ServerApiVersion } from "mongodb";

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient> | undefined;

function getMongoClient() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env");
  }

  if (!clientPromise) {
    const options = {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      tls: true,
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 10000,
      retryWrites: true,
      w: "majority" as const,
    };

    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function connectToMongoDB() {
  try {
    const mongoClient = await getMongoClient();
    console.log("You successfully connected to MongoDB!");
    return mongoClient;
  } catch (error) {
    console.dir(error);
    throw error;
  }
}

export async function disconnectFromMongoDB() {
  if (client) {
    await client.close();
    client = undefined;
    clientPromise = undefined;
  }
}

export async function getMongoDB(databaseName?: string) {
  const mongoClient = await getMongoClient();
  return mongoClient.db(databaseName);
}

export async function pingMongoDB() {
  const mongoClient = await getMongoClient();
  await mongoClient.db("admin").command({ ping: 1 });
  return true;
}
