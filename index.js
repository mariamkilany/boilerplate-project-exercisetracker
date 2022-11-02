const express = require('express')
const app = express()
const db = require("mongodb")
const mongoose = require('mongoose')
const cors = require('cors')
var bodyParser = require('body-parser')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
//connect db
const connectDB = (url) => {
  return mongoose.connect(url)
}
connectDB(process.env.MONGO_URL)
//schema
const UserExSchema = new mongoose.Schema({
    username:{
        type:String,
        requird:[true,'user name must be provided']
    },
    log:{ type : Array , "default" : [] }                            
})
var userModel = mongoose.model('users',UserExSchema);

app.post('/api/users',urlencodedParser,(req,res)=>{
   if(req.body.username===''){
     res.json({error:"username can't be empty"})
   }
  var userDetails = new userModel({
        username: req.body.username,
      });
  userDetails.save((err, doc) => {
            if (!err)
              res.json({username:doc.username,_id:doc._id})
            else {
                console.log(err);
                }
      });
})
app.get('/api/users',(req,res)=>{
  userModel.find({},{_id:1,username:1}).exec(function(err, users) {
    res.send(users)
})  
})
app.post('/api/users/:_id/exercises',urlencodedParser,(req,res)=>{
  let date = req.body.date?new Date(req.body.date).toDateString() : new Date().toDateString();
  var exercise ={
    description:req.body.description,
    duration:req.body.duration,
    date:date
  }
   
userModel.findByIdAndUpdate(req.params._id, {$push:{log:exercise}},{ $inc: { count: 1 }}, function(err,user) {
console.log({_id:user._id,username:user.username,description:exercise.description,duration:parseInt(exercise.duration),date:exercise.date})
res.json({_id:user._id,username:user.username,description:exercise.description,duration:parseInt(exercise.duration),date:exercise.date})
  
})
})

app.get('/api/users/:_id/logs',(req,res)=>{
  var id=req.params._id
  const from = req.query.from;
  const to = req.query.to;
  const limit = +req.query.limit;
  userModel.findOne({_id:id}).exec((err,result)=>{
    console.log(result.log)
    var map= result.log.map((ob)=>{
      return {description: ob.description, duration: parseInt(ob.duration), date: ob.date}
    });
  if (from){
      const fromDate = new Date(from)
      map = map.filter(exe => new Date(exe.date)>= fromDate)
    }
    if (to){
      const toDate = new Date(to)
      map = map.filter(exe => new Date(exe.date)<= toDate)
    }
    if(limit){
      map = map.slice(0,limit)
    }  res.json({_id:result._id,username:result.username,count:result.log.length,log:map})
    if(err)
      console.log(err)
  })
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
