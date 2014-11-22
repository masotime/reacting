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
    resetOptions: function() {
        this.setState({options: []});
    },
    addDropdownOption: function() {
        var currentOptions = this.state.options;
        currentOptions.push({
            type: 'dropdown',
            data: {
                name: '',
                currency: 'USD',
                symbol: '$',
                options: [
                    {
                        name: '',
                        price: ''
                    },
                    {
                        name: '',
                        price: ''
                    }                    
                ]
            }
        });
        this.setState({options: currentOptions});
    },
    addTextfieldOption: function() {
        var currentOptions = this.state.options;
        currentOptions.push({
            type: 'textfield',
            data: {
                name: ''
            }
        });
        this.setState({options: currentOptions});        
    },
    render: function() {
        var className = this.props.className;
        var options = this.state.options;
        var optionComponents = this.state.options.map(function(option, index) {
            switch(option.type) {
                case 'dropdown':
                    return <DropdownOptionEditor key={index} optionName={option.data.name} currency={option.currency} options={option.data.options} />;
                case 'textfield':
                    return <TextfieldOptionEditor key={index} optionName={option.data.name} />;
            }
        });
        
        return (
            <div className={className}>
                <h3>This is a preview</h3>
                <Preview options={options} />
                
                <h3>This is the Options Editor</h3>
                <button onClick={this.resetOptions}>Remove all options</button>
                {optionComponents}
                <button onClick={this.addDropdownOption}>Add dropdown option</button>
                <button onClick={this.addTextfieldOption}>Add textfield option</button>
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
                                        option.data.options.map(function(selectOption, index) {
                                            return <option key={index} value={selectOption.price}>{selectOption.name} {option.data.symbol}{selectOption.price}</option>;
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
            optionName: '',
            options: [],
            currency: 'USD',
            symbol: '$',
            key: 0
        };    
    },
    onChange: function() {
    },
    render: function() {
        var className = this.props.className;
        var optionName = this.props.optionName;
        var currency = this.props.currency;
        var optionPriceFields = this.props.options.map(function(optionPrice, index) {
            return (
                <OptionPriceField 
                    key={index} 
                    optionName={optionPrice.name}
                    price={optionPrice.price}
                    curency={currency}
                />
            );      
        });
        var validator = function(value) {
            if (value.length === 0) {
                return 'Please give a name for this option';
            }
        };
        
        return (
            <div className={className}>
                <EditorWidget />
                <TextField onChange={this.onChange} label="Option name" value={optionName} className="paypal-input" validators={[validator]}/>
                {optionPriceFields}
            </div>
        );
    }
});

var OptionPriceField = React.createClass({
    getDefaultProps: function() {
        return {
            className: 'option-price',
            optionName: '',
            price: '',
            currency: 'USD',
            removable: true,
            key: 0
        }
    },
    onChange: function() {
    
    },
    onDelete: function() {
        var onDelete = this.props.onDelete;
        onDelete && onDelete();
    },
    render: function() {
        var className = this.props.className;
        var optionName = this.props.optionName;
        var price = this.props.price;
        var currency = this.props.currency;
        var deleteButton;
        
        if (this.props.removable) {
            deleteButton = <button onClick={this.onDelete}>Delete</button>
        }
        
        return (
            <div className={className}>
                <TextField placeholder="Option" className="paypal-input" value={optionName} />
                <TextField placeholder="Price" className="paypal-input" value={price} />
                <CurrencySelect />
                {deleteButton}
            </div>
        );
    }
});

var TextfieldOptionEditor = React.createClass({
    getDefaultProps: function() {
        return {
            className: 'textfield-option-editor',
            optionName: ''
        };
    },
    onChange: function(value) {
        var onChange = this.props.onChange;
        onChange && onChange({optionName: value});
    },
    render: function () {
        var className = this.props.className;
        var optionName = this.props.optionName;
        var validator = function(value) {
            if (value.length === 0) {
                return 'Please give a name for this option';
            }
        };
        
        
        return (
            <div className={className}>
                <EditorWidget />
                <TextField label="Option name" className="paypal-input" onChange={this.onChange} value={optionName} validators={[validator]}/>
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