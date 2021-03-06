const express = require('express');
const imdb = require('./sandbox').Sandbox;
const bodyParser = require('body-parser')
const graphqlHTTP = require('express-graphql');
const { GraphQLSchema } = require('graphql');

var mongoUtil = require('./src/db.js');

const port = 9292;
const app = express();

const DENZEL_IMDB_ID = 'nm0000243';

// Definition des CORS
app.use(function(req, res, next) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

mongoUtil.connectToMongo(err => {
  const { queryType } = require('./src/graphql/query.js');
  const { mutationType } = require('./src/graphql/mutation.js');
  const schema = new GraphQLSchema({ query: queryType, mutation: mutationType });

  var collection = mongoUtil.getDB().collection("movies");

  app.use(bodyParser.json());

  app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true
  }));

  app.get('/hello', (req, res) => {
    res.json({ "hello": "world" });
  }
  );

  app.get('/movies/populate', (req, res) => {
    imdb.getMovies(DENZEL_IMDB_ID).then(movies => {
      collection.ensureIndex({id:1}, {unique:true});
      collection.insertMany(movies,{ ordered: false }, (error, result) => {
        if (error) {
          return res.status(500).send(error);
        }
        res.json(result);
      });
    });
  })

  app.get('/movies-all', (req, res) => {
    collection.find({}).toArray((error, result) => {
      if (error) {
        return res.status(500).send(error);
      }
      res.send(result);
    });
  })

  app.get('/movies', (req, res) => {
    collection.aggregate([
      { "$match": { "metascore": { "$gte": 70 } } },
      { "$sample": { "size": 1 } }
    ]).toArray((error, result) => {
      if (error) {
        return res.status(500).send(error);
      }
      // var awesome = result.filter(movie => movie.metascore >= 77);
      res.send(result);
    });
  })


  app.get('/movies/search', (req, res) => {
    var limit = Number(req.query.limit) || 5;
    var metascore = Number(req.query.metascore) || 0;
    if (limit || metascore) {
      collection.aggregate([
        { "$match": { "metascore": { "$gte": metascore } } },
        { "$sample": { "size": limit } }
      ]).toArray((err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ 'limit': limit, 'metascore': metascore, 'results': result });
      })
    }
  })

  app.get('/movies/:id', (req, res) => {
    var id = req.params.id;
    collection.findOne({ "id": id }, (err, result) => {
      if (err) return res.status(500).send(error);
      if (result) res.send(result);
      else res.json({ "error": `${id} movie does not exist!` });
    });
  })

  app.post('/movies/:id', (req, res) => {
    var id = req.params.id;
    console.log(req.body);
    collection.updateOne({ "id": id }, { "$set": { "review": req.body } }, (err, result) => {
      if (err) return res.status(500).send(error);
      console.log(result.result);
      res.end("ok");
    })
  })


  app.listen(process.env.PORT || port);
  console.log(`Server Running at localhost:${port}`);
});