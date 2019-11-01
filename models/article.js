var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var MongoArticles = new Schema({
  title: {
    type: String,
    required: true
  },
  summary: {
    type: String,
  },
  link: {
    type: String,
    required: true
  },
  saved: {
    type: Boolean,
    default: false
  },
  notes: [{
     type: Schema.Types.ObjectId,
     ref: "Note"
  }]
});

var Article = mongoose.model("Article", MongoArticles);

module.exports = Article;