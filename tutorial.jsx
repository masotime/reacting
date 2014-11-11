var fb = new Firebase("https://boiling-inferno-3245.firebaseio.com/");

// seriously the tutorial is confusing beyond belief.
// - CommentBox
//  - CommentList
//    - Comment
//  - CommentForm

// CommentBox - this is the head of the tree
var CommentBox = React.createClass({
    // bubbling of event from the CommentForm component
    handleCommentSubmit: function(comment) {
        // we optimistically assume that the comment will be posted without problems
        var that = this;
        var comments = that.state.data;
        
        // assign id based on the comments array length (will have race condition issues....)
        comment.id = comments.length + 1;
        
        var newComments = comments.concat([comment]);
        // this.setState({data: newComments});
        
        fb.set({comments: newComments}, function(err) {
            if (!err) {
                that.setState({data: newComments});
            } else {
                alert(err);
            }
        });
    },
    handleCommentDelete: function(id) {
        var that = this;
        var filteredComments = this.state.data.filter(function(comment) {
            return comment.id != id;
        }).map(function(comment, index) {
            // re-index the ids
            comment.id = index + 1;
            return comment;
        });
        
        // delete on the back end
        fb.set({comments: filteredComments}, function(err) {
            if (!err) {
                that.setState({data: filteredComments});
            } else {
                alert(err);
            }
        });
    },
    getInitialState: function() {
        return { data: [] };
    },
    componentDidMount: function() {
        var that = this;
    
        // use firebase instead. since this is evented, we don't need setInterval from the tutorial
        fb.on("value", function(snapshot) {
            that.setState({data: snapshot.val().comments});
        }, function(error) {
            console.error(error);
        });
    },
    render: function() {
        // it could also use {this.props.data}, but then it would be immutable / static
        return (
            <div className="commentBox">
                <h1>Comment Box</h1>
                <CommentList data={this.state.data} onCommentDelete={this.handleCommentDelete} />
                <CommentForm onCommentSubmit={this.handleCommentSubmit} /> {/* parent supplies a property that is invoked by the child */}
            </div>
        );
    }
});

// CommentList
var CommentList = React.createClass({
    render: function() {
        var that = this; // I HATE THIS
        
        // generates repeating comments based on the data
        var commentNodes = this.props.data.map(function(comment) {
            return (
                <Comment author={comment.author} key={comment.id} id={comment.id} onCommentDelete={that.props.onCommentDelete}>
                {comment.text}
                </Comment>
            );
        });
        return (
            <div className="commentList">
            {commentNodes}
            </div>
        );
    }
});

// CommentForm
var CommentForm = React.createClass({
    // bound in the template via onSubmit={this.handleSubmit}
    handleSubmit: function(e) {
        e.preventDefault();
        
        // roundabout way to get the DOM element via the "ref" attribute
        var author = this.refs.author.getDOMNode().value.trim(); // frigging monstrosity
        var text = this.refs.text.getDOMNode().value.trim();
        
        // here's where the actual logic is
        if (text && author) {
            // call the parent function?
            this.props.onCommentSubmit({author: author, text:text});
            
            // Just clear the data
            this.refs.author.getDOMNode().value = '';
            this.refs.text.getDOMNode().value = '';
        }
    },
    render: function() {
        return (
            <form className="commentForm" onSubmit={this.handleSubmit} >
                <input type="text" name="name" placeholder="Your name" ref="author" /> {/* note the "ref" data binding */}
                <textarea name="comment" placeholder="Say something..." ref="text" /> {/* note the "ref" data binding */}
                <input type="submit" value="Post" />
            </form>
        );
    }
});

// Comment (with markdown)
var converter = new Showdown.converter();
var Comment = React.createClass({
    handleDelete: function() {
        this.props.onCommentDelete(this.props.id);
    },
    render: function() {
        var rawMarkup = converter.makeHtml(this.props.children.toString());
        return (
            <div className="comment">
                <h2 className="commentAuthor">
                    {this.props.author}
                </h2>
                <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
                <span className="action delete" onClick={this.handleDelete}>&#x2717;</span>
                <span className="action edit">&#x270E;</span>
            </div>
        );
    }
});

