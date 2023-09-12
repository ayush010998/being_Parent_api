const express=require('express');
const mongoose=require('mongoose');
const bodyParser=require('body-parser');


const app=express();
const port=process.env.PORT||3000;


//Connection to MongoDb

mongoose.connect('mongodb://localhost:27017/beingParent',{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

// Schema for the "groups" collection 
const groupSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true,
      minLength: 3,
      maxLength: 50,
    },
    description: {
      type: String,
      maxLength: 200,
    },
    createdBy: {
      type: String,
      required: true,
      maxLength: 50,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });
  
  const Group = mongoose.model('Group', groupSchema);

  // Schema for the "posts" collection 
const postSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 100,
    },
    content: {
      type: String,
      required: true,
      minLength: 10,
    },
    group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
      maxLength: 50,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });
  
  const Post = mongoose.model('Post', postSchema);
  

  app.use(bodyParser.json());

  // GET route to fetch the most active groups
app.get('/most-active-groups', async (req, res) => {
    try {
      const activeGroups = await Group.aggregate([
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'group_id',
            as: 'group_posts',
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            createdBy: 1,
            createdAt: 1,
            activity: { $size: '$group_posts' },
          },
        },
        {
          $sort: { activity: -1 },
        },
        {
          $limit: 10, 
        },
      ]);
      res.json(activeGroups);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch data from the database' });
    }
  });

  // POST route to create a new group
app.post('/create-group', async (req, res) => {
    try {
      const { name, description, createdBy } = req.body;
      const group = new Group({ name, description, createdBy });
      const result = await group.save();
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: 'Failed to create a new group', message: err.message });
    }
  });
  
  // POST route to create a new post
  app.post('/create-post', async (req, res) => {
    try {
      const { title, content, group_id, createdBy } = req.body;
      const post = new Post({ title, content, group_id, createdBy });
      const result = await post.save();
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: 'Failed to create a new post', message: err.message });
    }
  });

  // Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

