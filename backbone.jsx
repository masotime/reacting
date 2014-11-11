// taken from https://medium.com/react-tutorials/react-backbone-model-8aaec65a546c

var Profile = Backbone.Model.extend({
    defaults: {
        name: null,
        gender: null,
        picture: null
    }
});

var profile = new Profile({
    name: 'Chris Pratt',
    gender: 'male',
    picture: '//placekitten.com/g/200/200'
});

console.log(
    'name :' + profile.get('name') + '\n' +
    'gender :' + profile.get('gender') + '\n' +
    'picture :' + profile.get('picture') + '\n' 
);

var CardComponent = React.createClass({
    render: function() {
        return (
            <div className="card">
                <div className="picture">
                    <img src={this.props.profile.get("picture")} />
                </div>
                <div className="name">
                    {this.props.profile.get("name")}
                    <small>({this.props.profile.get("gender")})</small>
                </div>
            </div>
        );
    }
});