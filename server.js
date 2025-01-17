const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const User = require('./mongodb')

const bodyParser = require("body-parser");
const { count } = require('./mongodb')

app.use(bodyParser())
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res) => {
  const body = req.body
  const user = new User({
    username: body.username
  })
  user.save()
  .then(savedUser => {
    res.json({
      _id: savedUser._id,
      username: savedUser.username 
    })
  }).catch(err => {
    res.status(500).send(err.message)
  })
})

app.get('/api/exercise/users', (req, res) => {
  User.find().select({_id: 1, username: 1})
  .then(user => {
    res.json(user)
  })
  .catch(err => {
    res.status(500).send(err.message)
  })
})

app.post('/api/exercise/add', async (req, res) => {
  const body = req.body
  let currentDate;
  if(body.date) {
    currentDate = new Date(body.date).toDateString()
  } else {
    currentDate = new Date().toDateString()
  }

  let prevUserLogArray = await User.findById(body.userId).then(prevUser => {return prevUser.log})
  User.findByIdAndUpdate(body.userId, {
      description: body.description,
      duration: Number(body.duration),
      date: currentDate,
      log: 
      prevUserLogArray.concat([{
        description: body.description,
        duration: Number(body.duration),
        date: currentDate,
      }]),
      count: Number(prevUserLogArray.length + 1)
  }, {new: true}).select({log: 0, count: 0})
  .then(updateuser => {
    res.json(updateuser)
  }).catch(err => {
    res.status(500).send(err.message)
  })
})


app.get('/api/exercise/log', (req, res) => {
  const id = req.query.userId;
  console.log(req.query)

  const from = req.query.from === undefined ? new Date(-8640000000000000) : new Date(req.query.from);
  const to = req.query.to === undefined ? new Date() : new Date(req.query.to);
  const limit = Number(req.query.limit);
  console.log(limit)
  console.log(from)
  console.log(to)
    User.findById(id).select({_id: 1, username: 1, log: 1, count: 1})
    .then(user => {
      if(!user) {return res.status(404).send("Unknown userId")}
      else {
        const newLogArray = user.log.filter(exercise => new Date(exercise.date).getTime() >= from.getTime() && new Date(exercise.date).getTime() <= to.getTime())
        if(!isNaN(limit)) {
          user.log = newLogArray.slice(0, limit)
        } else {
          user.log = newLogArray
        }
        res.json(user)
      }
    })
    .catch(err => {
      res.status(500).send(err.message)
    })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
