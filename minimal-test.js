import express from 'express';
const app = express();
const router = express.Router();

router.get('/', (req, res) => res.json({test: 'works'}));
app.use('/api/auth', router);

app.listen(3004, () => console.log('Test on :3004'));
