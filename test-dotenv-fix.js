import dotenv from 'dotenv';
dotenv.config();
console.log('MONGODB_URI from env:', process.env.MONGODB_URI ? '✅ FOUND' : 'NOT FOUND');
if (process.env.MONGODB_URI) {
  console.log('URI (password hidden):', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
}
