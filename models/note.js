var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var MongoNotes = new Schema({
    body: {
        type: String
    },
    article: {
        type: Schema.Types.ObjectId,
        ref: "Article"
    }
});

var Note = mongoose.model("Note", MongoNotes);

module.exports = Note;