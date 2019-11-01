var express = require("express");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var path = require("path");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models")
var dotenv = require('dotenv');
dotenv.config()

mongoose.Promise = Promise;

var port = process.env.PORT || 8080

var app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/articlescrape";

mongoose.connect(MONGODB_URI);

var mc = mongoose.connection;

mc.on("error", function(err) {
  console.log("Mongoose Error: ", err);
});

mc.once("open", function() {
  console.log("Mongoose connection successful.");
});

app.get("/", function(req, res) {
  db.Article.find({"saved": false}, function(err, data) {
    var hbsObject = {
      article: data
    };
    console.log(hbsObject);
    res.render("index", hbsObject);
  });
});

app.get("/saved", function(req, res) {
  db.Article.find({"saved": true}).populate("notes").exec(function(err, articles) {
    var hbsObject = {
      article: articles
    };
    res.render("saved", hbsObject);
  });
});


app.get("/scrape", function(req, res) {
  axios.get("https://www.nytimes.com/").then(function(response) {
    var $ = cheerio.load(response.data);
    $("article").each(function(i, element) {
      var result = {};
      summary = ""
      if ($(this).find("ul").length) {
        summary = $(this).find("li").first().text();
      } else {
        summary = $(this).find("p").text();
      };
      result.title = $(this).find("h2").text();
      result.summary = summary;
      result.link = "https://www.nytimes.com" + $(this).find("a").attr("href");

      var entry = new db.Article(result);

      entry.save(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          console.log(doc);
        }
      });

    });
       res.send("Scrape Complete");

  });
});

app.get("/articles", function(req, res) {
  db.Article.find({}, function(err, doc) {
    if (err) {
      console.log(err);
    }
    else {
      res.json(doc);
    }
  });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ "_id": req.params.id })
  .populate("note")
  .exec(function(err, doc) {
    if (err) {
      console.log(err);
    }
    else {
      res.json(doc);
    }
  });
});

app.post("/articles/save/:id", function(req, res) {
      db.Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true})
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          res.send(doc);
        }
      });
});

app.post("/articles/delete/:id", function(req, res) {
      db.Article.findOneAndUpdate({ "_id": req.params.id }, {"saved": false, "notes": []})
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          res.send(doc);
        }
      });
});

app.post("/notes/save/:id", function(req, res) {
  var newNote = new db.Note({
    body: req.body.text,
    article: req.params.id
  });
  console.log(req.body)
  newNote.save(function(err, note) {
    if (err) {
      console.log(err);
    }
    else {
      db.Article.findOneAndUpdate({ "_id": req.params.id }, {$push: { "notes": note } })
      .exec(function(err) {
        if (err) {
          console.log(err);
          res.send(err);
        }
        else {
          res.send(note);
        }
      });
    }
  });
});

app.delete("/notes/delete/:note_id/:article_id", function(req, res) {
  db.Note.findOneAndRemove({ "_id": req.params.note_id }, function(err) {
    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
      db.Article.findOneAndUpdate({ "_id": req.params.article_id }, {$pull: {"notes": req.params.note_id}})
        .exec(function(err) {
          if (err) {
            console.log(err);
            res.send(err);
          }
          else {
            res.send("Note Successfully Deleted");
          }
        });
    }
  });
});

app.listen(port, function() {
  console.log("App running on port: " + port);
});