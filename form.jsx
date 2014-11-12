var TextField = React.createClass({
    getInitialState: function() {
        return { 
            errors: [],
            hints: [],
            validated: false
        };
    },
    onBlur: function() {
        // blur always validates and hints
        this.setState({
            errors: this.validate(),
            hints: this.help(),
            validated: true
        });
    },
    onFocusOrChange: function() {
        var current = this.state, newState = {
            errors: current.errors,
            validated: current.validated,
            hints: this.help()
        };
        
        // revalidate only if validated and errors.length > 0
        if (current.validated && current.errors.length > 0) {
            newState.errors = this.validate();
            newState.validated = true;
        }
        
        this.setState(newState);
    },
    validate: function() {
        var self = this;
        var errors = [];
        this.props.validators.forEach(function(validator) {
            var result = validator(self.refs.value.getDOMNode().value);
            result && errors.push(result);
        });
        return errors;
    },
    help: function() {
        var self = this;
        var hints = [];
        this.props.helpers.forEach(function(helper) {
            var result = helper(self.refs.value.getDOMNode().value);
            result && hints.push(result);
        });
        return hints;
    },
    render: function() {
        var id = this.props.id || this.props.name;
        var label = this.props.label || this.props.name;
        var placeholder = this.props.placeholder || this.props.label;
        var className = 'inputField';
        
        // if there are errors or hints, show whatever is appropriate
        this.state.errors.length > 0 && (className += ' hasError');
        this.state.hints.length > 0 && (className += ' hasHints');
        
        return (
            <div className={className}>
                <label htmlFor={id}>{label}</label>
                <input id={id} name={name} placeholder={placeholder} onBlur={this.onBlur} onFocus={this.onFocusOrChange} onChange={this.onFocusOrChange} ref="value" />
                <FieldInfo containerClass="errors" itemClass="error-item" infoArray={this.state.errors} />
                <FieldInfo containerClass="hints" itemClass="hint-item" infoArray={this.state.hints} />
            </div>
        );
    }
});

var FieldInfo = React.createClass({
    getDefaultProps: function() {
        return {
            containerClass: 'info',
            itemClass: 'info-item',
            infoArray: []
        };
    },
    render: function() {
        var self = this;
        var items = this.props.infoArray.map(function(info) {
            return <li className={self.props.itemClass}>{info}</li>;
        });
        
        if (this.props.infoArray.length === 0) {
            return null;
        } else {
            console.log('rendering components');
            return (
                <span className={this.props.containerClass}>
                    <ul>
                        {items}
                    </ul>
                </span>
            );
        }
    }
});