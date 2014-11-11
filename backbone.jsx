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
    picture: '//latimesherocomplex.files.wordpress.com/2014/04/1810700_ca_sneaks_chris_pratt_09_rrd.jpg'
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

// reference: http://www.thomasboyt.com/2013/12/17/using-reactjs-as-a-backbone-view.html
var MyWidget = React.createClass({
    render: function() {
        return <a href="#" onClick={this.props.onClick}>Do something!</a>
    }
});

var MyView = Backbone.View.extend({
    el: '#content',
    template: '<div class="widget-container"></div><div class="outside-container"></div>',
    onClick: function() {
        this.$('.outside-container').html('The link was clicked');
    },
    render: function() {
        this.$el.html(this.template);
        React.render(<MyWidget onClick={this.onClick} />, this.$('.widget-container').get(0));
        return this; // why?
    }
});

new MyView().render();