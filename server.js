const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config()

const Schema = mongoose.Schema;

mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }]
});

const exerciseSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  date: {
    type: mongoose.Schema.Types.Date,
    default: Date.now()
  }
});

const Exercice = mongoose.model('Exercise', exerciseSchema);
const User = mongoose.model("User", userSchema);

app.post('/api/exercise/new-user', (req, res) => {
  const { username } = req.body;
  const user = new User({ username });
  user.save((err, { _id }) => {
    if (err) return res.json({ err });

    return res.json({ username, _id });
  });
});

app.get('/api/exercise/users', (req, res) => {
  User.find({}, (err, users) => {
    if (err) return res.json({ err });

    return res.json(users.map(({username, _id}) => ({username, _id})));
  });
});

app.post('/api/exercise/add', (req, res) => {
  let { userId, date } = req.body;
  if (!date) date = Date.now();
  const exercise = new Exercice({ ...req.body, user: userId, date });

  exercise.save((err, {description, duration, date}) => {
    if (err) return res.json({ err });

    User.findById(req.body.userId, (err, user) => {
      if (err) return res.json({ err });

      user.exercises.push(exercise);
      user.save((err) => {
        return res.json({
          _id: user._id,
          username: user.username,
          description,
          duration,
          date: new Date(date).toUTCString()
        });
      });

    });
  });
});

app.get('/api/exercise/log', (req, res) => {
  const { userId, from = "1970-01-01", to = Date.now(), limit } = req.query;

  User.findById(userId)
    .populate({
      path: 'exercises',
      options: { limit },
      match: { date: { $gte: from, $lte: to }}
    })
    .exec((err, user) => {
      if (err) return res.json({ err });

      return res.json({
        _id: user._id,
        log: user.exercises.map(({description, duration, date}) => ({description, duration, date})),
        count: user.exercises.length
      });
    })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
