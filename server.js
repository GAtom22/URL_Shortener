"use strict";
var i = 0;
var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var dns = require('dns');

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
mongoose.connect(MONGO_URI);
var db = mongoose.connection;
var status = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting"
};
console.log("Mongo DB " + status[mongoose.connection.readyState]);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require("body-parser");

// Create URL prototype for the DB
var Schema = mongoose.Schema;
var url_schema = new Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true }
});
var url_model = mongoose.model("URL", url_schema);

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Get ready for POST Requests - the `body-parser`
app.use(bodyParser.urlencoded({ extended: false }));

// your first API endpoint...
app.post("/api/shorturl/new", function(req, res) {
  var url = req.body.url;
  
  // Check for valid URL
  var url_lookup = url.split('//')[1];
  if(url_lookup==undefined){url_lookup='incorrectURL'}
  console.log(url_lookup);
  dns.lookup(url_lookup,function(err,address){
    if(err){
      //console.error(err);
    res.json({"error":"invalid URL"})
  }else{
    
    // if it is valid, proceed to save
        var short_url = i++;
        var new_url = { original_url: url, short_url: short_url };   
    
    // create & save the url and short url in DB
        var URL = new url_model(new_url);
        URL.save()
          .then(item => {
          console.log("item saved to database");
          })
          .catch(err => {
            console.log("unable to save to database");
          });
       
        res.json(new_url);
    
    // check database connection
        console.log("Mongo DB " + status[mongoose.connection.readyState]);
        }})
  
});


  //visit the short url and goes to the original url
  app.get("/api/shorturl/:short_url?",function(req,res){
    var sh_url = req.params.short_url;
    
    url_model.findOne({short_url: sh_url}, function(err, urlFound){
      if(err) return console.error(err)
      res.statusCode=302;
      res.setHeader('Location',urlFound.original_url);
      res.end();
    })
  });
    


app.listen(port, function() {
  console.log("Node.js listening ...");
});
