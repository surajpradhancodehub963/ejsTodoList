const mongoose = require("mongoose");
require('dotenv').config();

mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.MONGO_ATLAS_URL)
  .then(() => {
    console.log("userDB created");
  })
  .catch((err) => {
    console.log(err);
  });



const customlistSchema = {
  userId:String,
  listTitle: String,
  tasks: [
    {
      work:String,
      status:String
    }
  ],
};

const List = mongoose.model("List", customlistSchema);

const userSchema = new mongoose.Schema({
  id:String,
  name: String,
  email: String,
  password: String
});


const User = mongoose.model("User", userSchema);

module.exports ={
    List:List,
    User:User
};