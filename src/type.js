const GraphQLJSON = require ('graphql-type-json');
const {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLInt
} = require('graphql');

// Define Movie Type
movieType = new GraphQLObjectType({
  name: 'Movie',
  fields: {
      link: { type: GraphQLString },
      metascore: { type: GraphQLInt },
      synopsis: { type: GraphQLString },
      title: { type: GraphQLString },
      year: { type: GraphQLInt },
      review: {type: GraphQLJSON}
  }
});

exports.movieType = movieType;