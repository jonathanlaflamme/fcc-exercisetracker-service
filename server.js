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
  }
});

const User = mongoose.model("User", userSchema);

const exerciseSchema = new Schema({
  userId: {
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

app.post('/api/exercise/new-user', (req, res) => {
  const { username } = req.body;
  const user = new User({username});
  user.save((err, data) => {
    if (err) return res.json({ err });

    return res.json(data);
  });
});

app.get('/api/exercise/users', (req, res) => {
  User.find({}, (err, data) => {
    if (err) return res.json({ err });

    return res.json(data);
  });
});

app.post('/api/exercise/add', (req, res) => {
  User.findById(req.body.userId, (err, user) => {
    if (err) return res.json({ err });

    const exercise = new Exercice(req.body);
    exercise.save((err, data) => {
      if (err) return res.json({ err });

      return res.json({
        _id: user._id,
        username: user.username,
        description: data.description,
        duration: data.duration,
        date: data.date
      });
    });
  });

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
