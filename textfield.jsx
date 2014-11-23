    var TextField = React.createClass({
        getInitialState: function () {
            return { 
                errors: [],
                hints: [],
                processed: false, // validated and error state added if any
                hasFocus: false,
                hasText: false
            };
        },
        getDefaultProps: function () {
            return {
                type: 'text',
                validators: [],
                helpers: [],
                value: ''
            }
        },
        componentDidMount: function () {
            var self = this,
                pushTrigger = this.props.pushTrigger,
                onReady = this.props.onReady

            if (pushTrigger) {
                pushTrigger(function() {
                    self.process();
                });
            }

            if (onReady) {
                onReady(this.refs.value.getDOMNode());
            }
        },
        onBlur: function () {
            this.setState({ hasFocus: false });        
            this.process();
        },
        onFocus: function () {
            this.setState({ hasFocus: true });
            this.hint();
        },
        onChange: function () {
            this.setState({ hasText: (this.refs.value.getDOMNode().value.length > 0) });
            this.hint();
            if (this.props.onChange) {
                this.props.onChange(this.refs.value.getDOMNode().value);
            }
        },
        process: function () {
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
        reset: function () {
            var inputEl = this.refs.value.getDOMNode();
            inputEl.value = '';
            this.onChange();
            inputEl.focus();        
        },
        render: function () {
            var id = this.props.id || this.props.name;
            var name = this.props.name;
            var label = this.props.label || this.props.name;
            var placeholder = this.props.placeholder || this.props.label;
            var className = this.props.className || 'inputField';
            
            // determine some rendering toggles
            var current = this.state;
            var containerClass, itemClass, inputType, infoArray, tooltip, clearWidget;
            
            inputType = this.props.type === 'password' ? 'password' : 'text';

            if (current.processed && current.errors.length > 0) {
                className += ' has-error';
            }
            
            if (current.hasFocus) {
                if (current.processed && current.errors.length > 0) {
                    containerClass = 'errors';
                    itemClass = 'error-item';
                    infoArray = current.errors;
                } else if (current.hints.length > 0) {
                    containerClass = 'hints';
                    itemClass='hint-item';
                    infoArray = current.hints;
                }
            }
            
            if (current.hasText) {
                clearWidget = <FieldWidget className="clear-input" label="&times;" onClick={this.reset} />;
            }
            
            tooltip = current.hasFocus ? <FieldInfo containerClass={containerClass} itemClass={itemClass} infoArray={infoArray} /> : null;
            
            return (
                <div className={className}>
                    <label htmlFor={id}>{label}</label>
                    <input type={inputType} id={id} name={name} placeholder={placeholder} onBlur={this.onBlur} onFocus={this.onFocus} onChange={this.onChange} ref="value" disabled={this.props.disabled} defaultValue={this.props.value} />
                    {clearWidget}
                    {tooltip}
                </div>
            );
        }
    });

    var FieldInfo = React.createClass({
        getDefaultProps: function () {
            return {
                containerClass: 'info',
                itemClass: 'info-item',
                infoArray: []
            };
        },
        render: function () {
            var self = this;
            var infoArray = self.props.infoArray;
            var items = infoArray.map(function(info) {
                return <li className={self.props.itemClass} dangerouslySetInnerHTML={{__html: info}}></li>;
            });
            
            if (items.length === 0) {
                return null;
            } else if (items.length === 1) {
                return (
                    <div className={this.props.containerClass}>
                        <span className={self.props.itemClass} dangerouslySetInnerHTML={{__html: infoArray[0]}}></span>
                    </div>
                );
            } else {
                return (
                    <div className={this.props.containerClass}>
                        <ul>
                            {items}
                        </ul>
                    </div>
                );
            }
        }
    });

    var FieldWidget = React.createClass({
        getDefaultProps: function () {
            return {
                className: '',
                label: ''
            };
        },
        onClick: function (e) {
            e.preventDefault();
            if (this.props.onClick) {
                this.props.onClick();
            }
        }, render: function () {
            return (
                <button tabIndex="-1" className={this.props.className} onClick={this.onClick}>{this.props.label}</button>
            );
        }
    });