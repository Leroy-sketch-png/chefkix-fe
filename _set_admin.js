const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://chefkix:chefkix-dev-password@localhost:27017/chefkix');
client.connect().then(async () => {
  const db = client.db('chefkix');
  const res = await db.collection('user_profiles').updateOne(
    { username: 'testuser' },
    { $set: { accountType: 'admin' } }
  );
  console.log('Modified:', res.modifiedCount);
  const user = await db.collection('user_profiles').findOne({ username: 'testuser' }, { projection: { username: 1, accountType: 1 } });
  console.log('testuser accountType now:', user?.accountType);
  await client.close();
}).catch(console.error);
