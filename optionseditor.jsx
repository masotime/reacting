var OptionsEditor = React.createClass({
    getDefaultProps: function() {
        return {
            className: 'options-editor'
        };
    },
    componentWillMount: function() {
        if (this.props.options) {
            this.setState({options: this.props.options});
        }
    },
    getInitialState: function() {
        // store the physical dropdown / text editor data
        return {
            options: []
        };
    },
    render: function() {
        var className = this.props.className;
        var options = this.state.options;
        var optionComponents = this.state.options.forEach(function(option) {
            
        });
        
        return (
            <div className={className}>
                <h3>This is a preview</h3>
                <Preview options={options} />
                
                <h3>This is the Options Editor</h3>
                <DropdownOptionEditor/>
                <TextfieldOptionEditor />
            </div>
        );
    }
});

var Preview = React.createClass({
    getDefaultProps: function() {
        return {
            options: []
        };
    },
    render: function() {
        var options = this.props.options;
        
        return (
            <div>
            {
                options.map(function(option, index) {
                    switch (option.type) {
                        case 'dropdown':
                            return (
                                <div key={index}>
                                    <label>{option.data.name}</label>
                                    <select name={'option-'+index}>
                                    {
                                        option.data.options.map(function(option, index) {
                                            return <option key={index} value={option.price}>{option.name} {option.symbol}{option.price}</option>;
                                        })
                                    }
                                    </select>
                                </div>
                            );
                        case 'textfield':
                            return (
                                <div key={index}>
                                    <label>{option.data.name}</label>
                                    <input type="text" name={'option-'+index} />
                                </div>
                            );
                    }
                })
            }
            </div>
        );
    }
});

var DropdownOptionEditor = React.createClass({
    getDefaultProps: function() {
        return {
            className: 'dropdown-option-editor',
            name: '',
            options: []
        };    
    },
    render: function() {
        var className = this.props.className;
        var validator = function(value) {
            if (value.length === 0) {
                return 'Please give a name for this option';
            }
        }        
        
        return (
            <div className={className}>
                <EditorWidget />
                <TextField label="Option name" className="paypal-input" validators={[validator]}/>
                <OptionPriceField />
            </div>
        );
    }
});

var OptionPriceField = React.createClass({
    getDefaultProps: function() {
        return {
            className: 'option-price',
            name: '',
            price: '',
            currency: 'USD'
        }
    },
    render: function() {
        var className = this.props.className;
        
        return (
            <div className={className}>
                <TextField placeholder="Option" className="paypal-input" />
                <TextField placeholder="Price" className="paypal-input" />
                <CurrencySelect />
            </div>
        );
    }
});

var TextfieldOptionEditor = React.createClass({
    getDefaultProps: function() {
        return {
            className: 'textfield-option-editor',
            name: ''
        };    
    },
    render: function () {
        var className = this.props.className;
        var name = this.props.name;
        var validator = function(value) {
            if (value.length === 0) {
                return 'Please give a name for this option';
            }
        };
        
        
        return (
            <div className={className}>
                <EditorWidget />
                <TextField label="Option name" className="paypal-input" value={name} validators={[validator]}/>
            </div>
        );
    }
});

/* 

   The widget does not contain state, but will display different buttons based on prop.mode and return feedback
   via onClick.
   
   * className - CSS Class
   * mode - ['view', 'edit']
   * onClick(buttonname), buttonname - ['done', 'edit', 'delete']
   
*/
var EditorWidget = React.createClass({
    getDefaultProps: function() {
        return {
            className: 'editor-widget',
            mode: 'view'
        };
    },
    onClick: function(clicked) {
        if (this.props.onClick) {
            this.props.onClick(clicked);
        }
    },
    render: function () {
        var className = this.props.className;
        var buttonTypes = {
            'done': <button key="done" onClick={this.onClick('done')}>Done</button>,
            'edit': <button key="edit" onClick={this.onClick('edit')}>Edit</button>,
            'delete': <button key="delete" onClick={this.onClick('delete')}>Delete</button>
        };
        var buttons = [];
        
        switch (this.props.mode) {
            case 'view':
                buttons = [buttonTypes.edit, buttonTypes.delete];
                break;
                
            case 'edit':
                buttons = [buttonTypes.done, buttonTypes.delete];
                break;
        }
        
        return (
            <div className={className}>
                { buttons }
            </div>
        );
    }
});