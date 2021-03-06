var TextField = React.createClass({
    getInitialState: function() {
        return { 
            errors: [],
            hints: [],
            processed: false, // validated and error state added if any
            hasFocus: false
        };
    },
    componentDidMount: function() {
        var self = this;
        var pushTrigger = this.props.pushTrigger;
        if (pushTrigger) {
            pushTrigger(function() {
                console.log('boom!');
                self.process();
            });
        }
    },
    onBlur: function() {
        this.setState({ hasFocus: false });        
        this.process();
    },
    onFocus: function() {
        this.setState({ hasFocus: true });
        this.hint();
    },
    onChange: function() {
        this.hint();
    },
    process: function() {
        this.setState({ processed: true });
        this.hint();
    },
    hint: function () {
        var self = this;
        var errors = [];
        var hints = [];
        this.props.validators.forEach(function(validator) {
            var result = validator(self.refs.value.getDOMNode().value);
            result && errors.push(result);
        });
        this.props.helpers.forEach(function(helper) {
            var result = helper(self.refs.value.getDOMNode().value);
            result && hints.push(result);
        });
        this.setState({ hints: hints, errors: errors });
    },
    render: function() {
        var id = this.props.id || this.props.name;
        var label = this.props.label || this.props.name;
        var placeholder = this.props.placeholder || this.props.label;
        var className = 'inputField';
        
        // determine some rendering toggles
        var current = this.state;
        var containerClass, itemClass, infoArray, extraElement;
        
        if (current.processed && current.errors.length > 0) {
            className += ' hasError';
        }
        
        if (current.hasFocus) {
            infoArray = current.hints.concat(current.errors);
            if (current.processed && current.errors.length > 0) {
                containerClass = 'errors';
                itemClass = 'error-item';
            } else if (infoArray.length > 0) {
                containerClass = 'hints';
                itemClass='hint-item';
            }
        }
        
        extraElement = containerClass ? <FieldInfo containerClass={containerClass} itemClass={itemClass} infoArray={infoArray} /> : null;
        
        return (
            <div className={className}>
                <label htmlFor={id}>{label}</label>
                <input id={id} name={name} placeholder={placeholder} onBlur={this.onBlur} onFocus={this.onFocus} onChange={this.onChange} ref="value" />
                {extraElement}
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