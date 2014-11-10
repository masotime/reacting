// taken from https://medium.com/react-tutorials/react-components-828c397e3dc8

var HelloWorld = React.createClass({
    render: function() {
        return <div>hello world!</div>;
    }
});

React.renderComponent(
    <HelloWorld />,
    document.body
);