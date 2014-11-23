var InputsEditor = React.createClass({
    getDefaultProps: function() {
        return {
            className: 'inputs-editor',
            currency: 'USD',
            symbol: '$',
            maxDropdowns: 4,
            maxTextfields: 2,
            maxDropdownOptions: 10
        };
    },
    componentWillMount: function() {
        this.props.inputs && this.setState({inputs: this.props.inputs});
        this.props.currency && this.setState({currency: this.props.currency});
        this.props.symbol && this.setState({symbol: this.props.symbol});
    },
    getInitialState: function() {
        // store the physical dropdown / text editor data
        return {
            inputs: [],
            activeIndex: -1, // used for editing a specific index
            currency: 'USD',
            symbol: '$'
        };
    },
    removeInputs: function() {
        this.setState({inputs: []});
    },
    handle: function(action, path) {
    
        var self = this;
        var navigate = function navigate(obj, trail) {
            if (trail.length <= 1 || !obj.hasOwnProperty(trail[0])) {
                return { obj: obj, key: trail[0] };
            } else {
                return navigate(obj[trail[0]], trail.slice(1));
            }
        };
    
        var update = function update(obj, path, value) {
            var parts = path.split('.');
            var nav = navigate(obj, parts);
            if (nav.obj.hasOwnProperty(nav.key)) {
                nav.obj[nav.key] = value;
            } else if (parts.length > 1) {
                path = parts.slice(0,-2).concat([parts[parts.length-1]]).join('.');            
                console.log('Key not found, trying',path,'instead');
                update(obj, path, value);
            }
        };
        
        var remove = function remove(obj, path) {
            var nav = navigate(obj, path.split('.'));
            var obj = nav.obj;
            var key = nav.key;
            
            // respond according to the type
            if (Array.isArray(obj)) {
                obj.splice(key,1);
            } else {
                delete obj.key;
            }
        };
        
        return function(value) {
            var current = self.state;
            console.log('received action',action,'on path',path,'with value',value);
            
            // based on the action, react accordingly
            switch(action) {
                case 'CREATE':
                    // this signal is sent deeply by dropdown input
                    // too lazy to generalize for now
                    (function() {
                        var nav = navigate(current, path.split('.'));
                        var dropdownOptions = nav.obj[nav.key];
                        dropdownOptions.push({
                            name: '',
                            price: ''
                        });
                    }());
                    break;
                case 'UPDATE':
                    update(current, path, value);
                    break;
                case 'DELETE':
                    remove(current, path);
                    break;
                case 'EDIT':
                    current.activeIndex = path.split('.')[1];
                    break;
                case 'DONE':
                    current.activeIndex = -1;
                    break;
            }
            
            // update the graph
            self.setState(current);
            
        };
    },
    addDropdownInput: function() {
        var currentInputs = this.state.inputs;
        currentInputs.push({
            type: 'dropdown',
            data: {
                name: '',
                currency: this.props.currency,
                symbol: this.props.symbol,
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
        this.setState({inputs: currentInputs});
    },
    addTextfieldInput: function() {
        var currentInputs = this.state.inputs;
        currentInputs.push({
            type: 'textfield',
            data: {
                name: ''
            }
        });
        this.setState({inputs: currentInputs});        
    },
    render: function() {
        // all the props, which should remain invariant for interaction within this component
        var className = this.props.className;
        var currencies = this.props.currencies;
        var maxDropdownOptions = this.props.maxDropdownOptions;
        
        // all the state, which alters based on user input
        var inputs = this.state.inputs; // this is initially set by a prop of the same name
        var activeIndex = this.state.activeIndex;
        var currency = this.state.currency;
        var symbol = this.state.symbol;
        
        // handles "RESTful" calls from child components
        var handle = this.handle;
        
        // computed
        var allowMore = {
            dropdowns: inputs.filter(function(input) { return input.type === 'dropdown' }).length < this.props.maxDropdowns,
            textfields: inputs.filter(function(input) { return input.type === 'textfield' }).length < this.props.maxTextfields
        };
        
        // components
        var inputComponents = inputs.map(function(input, index) {
            // DOUBLE EQUALS ARE INTENTIONAL
            switch(input.type) {
                case 'dropdown':
                    return <DropdownInputEditor active={activeIndex == index} key={index} jsonPath={'inputs.'+index} trigger={handle} inputName={input.data.name} currency={currency} currencies={currencies} options={input.data.options} max={maxDropdownOptions} />;
                case 'textfield':
                    return <TextfieldInputEditor active={activeIndex == index} key={index} jsonPath={'inputs.'+index} trigger={handle} inputName={input.data.name} />;
            }
        });
        
        var result = (
            <div className={className}>
                <h3>This is a preview</h3>
                <Preview inputs={inputs} currency={currency} symbol={symbol} />
                
                <h3>This is the Options Editor</h3>
                <button onClick={this.removeInputs}>Remove all inputs</button>
                {inputComponents}
                {allowMore.dropdowns ? <button onClick={this.addDropdownInput}>Add dropdown input</button> : null}
                {allowMore.textfields ? <button onClick={this.addTextfieldInput}>Add textfield input</button> : null}
            </div>
        );
                
        return result;
    }
});

var Preview = React.createClass({
    getDefaultProps: function() {
        return {
            inputs: [],
            currency: 'USD',
            symbol: '$'
        };
    },
    render: function() {
        var inputs = this.props.inputs;
        var symbol = this.props.symbol;
        var currency = this.props.currency;
        
        return (
            <div>
            {
                inputs.map(function(input, index) {
                    switch (input.type) {
                        case 'dropdown':
                            return (
                                <div key={index}>
                                    <label>{input.data.name}</label>
                                    <select name={'input-'+index}>
                                    {
                                        input.data.options.map(function(selectOption, index) {
                                            return <option key={index} value={selectOption.price}>{[selectOption.name,symbol,selectOption.price].join(' ')}</option>;
                                        })
                                    }
                                    </select>
                                </div>
                            );
                        case 'textfield':
                            return (
                                <div key={index}>
                                    <label>{input.data.name}</label>
                                    <input type="text" name={'input-'+index} />
                                </div>
                            );
                    }
                })
            }
            </div>
        );
    }
});

var DropdownInputEditor = React.createClass({
    getDefaultProps: function() {
        return {
            className: 'dropdown-input-editor',
            inputName: '',
            options: [],
            currency: 'USD',
            symbol: '$',
            key: 0,
            active: false,
            currencies: [],
            max: 10
        };    
    },
    trigger: function(action, componentPath) {
        var upstreamTrigger = this.props.trigger,
            ownPath = this.props.jsonPath;
        
        return function onChange(value) {
            var upstreamPath = [ownPath, componentPath].reduce(function (acc, current) {
               return current !== undefined && current.toString().length > 0 && acc.concat(current.toString().split('.')) || acc;
            }, []).join('.');
            upstreamTrigger && upstreamTrigger(action, upstreamPath)(value);
        };
    },
    render: function() {
        var className = this.props.className;
        var inputName = this.props.inputName;
        var currency = this.props.currency;
        var currencies = this.props.currencies;
        var trigger = this.trigger;
        var active = this.props.active;
        var mode = active ? 'edit' : 'view';
        var optionPriceFields = [], allowMoreOptions = false;
        if (active) {
            optionPriceFields = this.props.options.map(function(optionPrice, index) {
                return (
                    <OptionPriceField 
                        key={index} 
                        optionName={optionPrice.name}
                        price={optionPrice.price}
                        currency={currency}
                        currencies={currencies}
                        jsonPath={'data.options.'+index}
                        trigger={trigger}
                        currencyChangeable={index === 0}
                    />
                );
            });
            allowMoreOptions = optionPriceFields.length < this.props.max;
        }
        var validator = function(value) {
            if (value.length === 0) {
                return 'Please give a name for this option';
            }
        };
        
        return (
            <div className={className}>
                <EditorWidget mode={mode} trigger={trigger}/>
                <TextField disabled={!active} onChange={this.trigger('UPDATE', 'data.name')} label="Option name" value={inputName} className="paypal-input" validators={[validator]}/>
                {optionPriceFields}
                {allowMoreOptions ? <button onClick={this.trigger('CREATE', 'data.options')}>Add option</button> : null }
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
            currencies: [],
            removable: true,
            currencyChangeable: true
        }
    },
    trigger: function(action, componentPath) {
        var upstreamTrigger = this.props.trigger,
            ownPath = this.props.jsonPath;
        
        return function onChange(value) {
            var upstreamPath = [ownPath, componentPath].reduce(function (acc, current) {
               return current !== undefined && current.toString().length > 0 && acc.concat(current.toString().split('.')) || acc;
            }, []).join('.');
            upstreamTrigger && upstreamTrigger(action, upstreamPath)(value);
        };
    },
    render: function() {
        var className = this.props.className;
        var optionName = this.props.optionName;
        var price = this.props.price;
        var currency = this.props.currency;
        var currencies = this.props.currencies;
        var trigger = this.trigger;
        var ownPath = this.props.jsonPath;
        var currencyComponent, deleteButton;
        
        if (this.props.currencyChangeable) {
            currencyComponent = <CurrencySelect onChange={trigger('UPDATE', 'currency')} currencies={currencies} selected={currency} />;
        } else {
            currencyComponent = <div className="currency-display">{currency}</div>;
        }
        
        if (this.props.removable) {
            deleteButton = <button onClick={trigger('DELETE')}>Delete</button>
        }
        
        return (
            <div className={className}>
                <TextField onChange={trigger('UPDATE', 'name')} placeholder="Option" className="paypal-input" value={optionName} />
                <TextField onChange={trigger('UPDATE', 'price')} placeholder="Price" className="paypal-input" value={price} />
                {currencyComponent}
                {deleteButton}
            </div>
        );        
    }
});

// corresponds to currencyfield in the paypal project
var CurrencySelect = React.createClass({
    getDefaultProps: function () {
        return {
            currencies: [
                { code: 'USD', symbol_native: '$' }
            ],
            selected: 'USD',
            name: 'currency_code'
        };
    },
    onChange: function(e) {
        var onChange = this.props.onChange;
        onChange && onChange(e.target.value);
    },
    render: function () {
        var selected = this.props.selected;
        var currencyList = this.props.currencyList;
        var name = this.props.name;

        return (
            <div>
                <select name={name} value={selected} onChange={this.onChange}>
                {
                    currencies.map(function(currency, index) {
                        return <option key={index} value={currency.code}>{currency.code}</option>;
                    })
                }
                </select>
            </div>
        );
    }
});

var TextfieldInputEditor = React.createClass({
    getDefaultProps: function() {
        return {
            className: 'textfield-input-editor',
            inputName: '',
            active: false
        };
    },
    trigger: function(action, componentPath) {
        var upstreamTrigger = this.props.trigger,
            ownPath = this.props.jsonPath;
        
        return function onChange(value) {
            var upstreamPath = [ownPath, componentPath].reduce(function (acc, current) {
               return current !== undefined && current.toString().length > 0 && acc.concat(current.toString().split('.')) || acc;
            }, []).join('.');
            upstreamTrigger && upstreamTrigger(action, upstreamPath)(value);
        };
    },
    render: function () {
        var className = this.props.className;
        var inputName = this.props.inputName;
        var trigger = this.trigger;
        var active = this.props.active;
        var mode = active ? 'edit' : 'view';
        var validator = function(value) {
            if (value.length === 0) {
                return 'Please give a name for this option';
            }
        };
        
        
        return (
            <div className={className}>
                <EditorWidget mode={mode} trigger={trigger} />
                <TextField disabled={!active} label="Option name" className="paypal-input" onChange={trigger('UPDATE', 'data.name')} value={inputName} validators={[validator]}/>
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
    trigger: function(action, componentPath) {
        var upstreamTrigger = this.props.trigger,
            ownPath = this.props.jsonPath;
        
        return function onChange(value) {
            var upstreamPath = [ownPath, componentPath].reduce(function (acc, current) {
               return current !== undefined && current.toString().length > 0 && acc.concat(current.toString().split('.')) || acc;
            }, []).join('.');
            upstreamTrigger && upstreamTrigger(action, upstreamPath)(value);
        };
    },
    render: function () {
        var className = this.props.className;
        var buttonTypes = {
            'done': <button key="done" onClick={this.trigger('DONE')}>Done</button>,
            'edit': <button key="edit" onClick={this.trigger('EDIT')}>Edit</button>,
            'delete': <button key="delete" onClick={this.trigger('DELETE')}>Delete</button>
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