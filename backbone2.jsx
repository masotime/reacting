
var apiConfig = {
    url: 'http://gateway.marvel.com/v1/public/characters',
    key: '4c56f6984960e9186514d34a7159b13b'
};

var Marvel = (function(config) {
    var Character = Backbone.Model.extend({});
    var Characters = Backbone.Collection.extend({
        model: Character,
        url: config.url,
        parse: function(res, opts) {
            return res.data.results;
        }
    });
    
    var collection = new Characters();
    
    var fetchData = function(query, callback) {
        collection.fetch({
            data: {
                nameStartsWith: query,
                apikey: config.key
            },
            error: function(err) {
                callback(err);
            },
            complete: function() {
                callback(null, collection);
            }
        });
    };
    
    return {
        fetchData: fetchData
    };
    
}(apiConfig));

Marvel.fetchData('Ch', function(err, collection) {
    if (err) {
        console.error(err);
    } else {
        console.log(collection);
    }
});

/*
var App = React.createClass({
    mixins: [Backbone.React.Component.mixin], // This is the backbone-react-component
    getDefaultProps: function() {
        return {
            searchIcon: true
        }
    },
    handlers: function (query) {
        var self = this;
        
        if (query.reset) {
            return this.getCollection().reset();
        }
        
        this.props.searchicon = false;
        this.getCollection().fetch(
    }
});
*/