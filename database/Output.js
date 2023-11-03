const mongoose = require("mongoose");

const outputSchema = new mongoose.Schema({
  code: String,
});

const Output = mongoose.model("Output", outputSchema);

module.exports = Output;
