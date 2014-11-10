// tutorial4.js
var CommentList = React.createClass({
    render: function() {
        return (
            <div className="commentList">
                <Comment author="Peter Hunt">Comment 1</Comment>
                <comment author="Jordan Walke">Comment _italics_ **bold** 2</Comment>
            </div>
        );
    };
});