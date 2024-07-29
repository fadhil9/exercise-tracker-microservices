const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const { type } = require('express/lib/response');
var bodyParser = require('body-parser');

//connect ke mongodb
mongoose.connect(process.env.URI)
.then(()=>{
  console.log('connected mongoDB');
}).catch(()=>{
  console.log('error: ',error)
})

//buat schema dan model untuk user
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username:String,
});
const User = mongoose.model("User",userSchema);

//schema dan model untuk exercises
const exerciseSchema = mongoose.Schema({
  user_id: {type :String, required : true},
  description: String,
  duration: Number,
  date: Date,
  })
const Exercises = mongoose.model('Exercises', exerciseSchema);


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())


app.get('/api/users',async (req,res)=>{
  try {
    const user = await User.find({}).select("_id username");
    if(!user){
      res.send({invalid:"user not found"})
    }else{
      res.send(user);
    }
  } catch (error) {
    console.error(error);
    res.json({invalid:error.message})
  }
})


app.post('/api/users',async (req,res)=>{
  try {
    const user = await User.create(req.body);
    res.status(200).json(user);
  } catch (error) {
    console.error(error)
    res.json({invalid:error.message});
  }
})

app.post('/api/users/:_id/exercises',async (req,res)=>{

  const id = req.params._id;
  const {description,duration,date} = req.body;
  let formatDate = date ? new Date(date):new Date();

  try {
    const user = await User.findById(id);
    if(!user){
      res.json({invalid:"user not found"})
    }else{
  
    const exerciseObj = new Exercises({
      user_id:user._id,
      description,
      duration,
      date: formatDate
    })

    const exercise = await exerciseObj.save();
    res.json({
      _id:user._id,
      username:user.username,
      description:exercise.description,
      duration:exercise.duration,
      date:new Date(exercise.date).toDateString()
    });
    
  }
  } catch (error) {
    console.error(error);
    res.json({invalid:error.message})
  }
})

app.get('/api/users/:_id/logs',async(req,res)=>{
  const id = req.params._id;
  const {from, to, limit} = req.query;

  const user = await User.findById(id);
  if(!user){
    res.json({"invalid":"user not found"})
  }
  console.log("user:",user);

  let dateObj ={};
  if(from){
    dateObj['$gte'] = new Date(from);
    console.log("from:",from)
  }
  if(to){
    dateObj['$lte'] = new Date(to);
    console.log("to:",to)
  }

  let filter ={
    user_id : id,
  }
  if(from || to){
    filter.date = dateObj
  }
  const exercise = await Exercises.find(filter).limit(+limit??500);

  const log = await exercise.map(e=>({
    description : e.description,
    duration : e.duration,
    date : e.date.toDateString()
  }))
  
  res.json({
    _id : user._id,
    username : user.username,
    from :new Date(from).toDateString(),
    to :new Date(to).toDateString(),
    count:exercise.length,
    log
  })

})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
