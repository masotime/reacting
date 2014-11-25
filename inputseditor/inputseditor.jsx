var InputsEditor = React.createClass({
    mixins: [TriggerMixin],
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
    controller: function(action, path, value, util) {
        var current = this.state,
            hasPricingIndex = this.getDropdownWithPricing();

        console.log('received action',action,'on path',path,'with value',value);

        // based on the action, react accordingly
        switch(action) {
            case 'RESET':
                current.inputs = [];
                break;
            case 'CREATE':
                // this signal is sent deeply by dropdown input
                // too lazy to generalize for now
                (function() {
                    var nav = util.navigate(current, path.split('.'));
                    var dropdownOptions = nav.obj[nav.key];
                    dropdownOptions.push({
                        name: '',
                        price: ''
                    });
                }());
                break;
            case 'UPDATE':
                util.update(current, path, value);
                break;
            case 'DELETE': // delete option
                util.remove(current, path);
                break;
            case 'EDIT': // edit option
                current.activeIndex = path.split('.')[1];
                break;
            case 'DONE': // done editing option
                current.activeIndex = -1;
                break;
            case 'REMOVE PRICING':
                util.update(current, path, false);
                break;
            case 'ADD PRICING':
                util.update(current, path, true);
                break;
            case 'APPEND DROPDOWN':
                current.inputs.push({ 
                    type: 'dropdown',
                    data: {
                        name: '',
                        hasPricing: hasPricingIndex === -1, // pricing only allowed if no other dropdown has pricing
                        options: [
                            { name: '', price: '' }, // pricing will be hidden if !hasPricing
                            { name: '', price: '' }
                        ]
                    }
                });
                current.activeIndex = current.inputs.length - 1;
                break;
            case 'APPEND TEXTFIELD':
                current.inputs.push({
                    type: 'textfield',
                    data: { name: '' }
                });
                current.activeIndex = current.inputs.length - 1;
                break;
        }

        // update the graph
        this.setState(current);
        
        // update the store
        this.props.store && this.props.store.push('inputs', current.inputs);
        
    },
    getDropdownWithPricing: function() {
        // based upon the inputs in the state, determine which
        // dropdown has pricing, if any, or return -1 otherwise.
        return this.state.inputs.reduce(function(result, current, index) {
            var hasPricing = current.type === 'dropdown' && current.data.hasPricing;
            if (hasPricing) {
                return index;
            } else {
                return result;
            }
        }, -1);
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
        
        // computed
        var hasPricingIndex = this.getDropdownWithPricing();
        var controller = this.handleWith(this.controller);
        var allowMore = {
            dropdowns: inputs.filter(function(input) { return input.type === 'dropdown' }).length < this.props.maxDropdowns,
            textfields: inputs.filter(function(input) { return input.type === 'textfield' }).length < this.props.maxTextfields
        };
        
        // components
        var inputComponents = inputs.map(function(input, index) {
            // DOUBLE EQUALS ON activeIndex ARE INTENTIONAL
            switch(input.type) {
                case 'dropdown':
                    return (<DropdownInputEditor 
                        active={activeIndex == index} 
                        key={index} 
                        jsonPath={'inputs.'+index} 
                        trigger={controller} 
                        inputName={input.data.name} 
                        currency={currency}
                        currencies={currencies}
                        options={input.data.options}
                        max={maxDropdownOptions}
                        hasPricing={hasPricingIndex === index}
                        allowPricing={hasPricingIndex === -1} 
                    />);
                case 'textfield':
                    return (<TextfieldInputEditor 
                        active={activeIndex == index} 
                        key={index} 
                        jsonPath={'inputs.'+index} 
                        trigger={controller} 
                        inputName={input.data.name} 
                    />);
            }
        });
        
        var result = (
            <div className={className}>
                
                <h3>This is the Options Editor</h3>
                <button onClick={controller('RESET')}>Remove all inputs</button>
                {inputComponents}
                {allowMore.dropdowns ? <button onClick={controller('APPEND DROPDOWN')}>Add dropdown input</button> : null}
                {allowMore.textfields ? <button onClick={controller('APPEND TEXTFIELD')}>Add textfield input</button> : null}
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
    componentWillMount: function() {
        var self = this;
        this.setState({inputs: this.props.inputs || []});
        if (this.props.store) {
            // register a callback
            this.props.store.pull('inputs', function(updatedInputs) {
                self.setState({inputs: updatedInputs});
            });
        }
    },
    componentWillUnmount: function() {
        // need to deregister at some point
    },
    render: function() {
        var inputs = this.state.inputs;
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
                                    <select name={'input-'+index} defaultValue={input.data.options[0].name || 0}>
                                    {
                                        input.data.options.map(function(selectOption, index) {
                                            var labelParts = [selectOption.name].concat(input.data.hasPricing ? [symbol, selectOption.price] : []);                                            
                                            return <option key={index} value={selectOption.name || index}>{labelParts.join(' ')}</option>;
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
    mixins: [TriggerMixin],
    getDefaultProps: function() {
        return {
            className: 'dropdown-input-editor',
            inputName: '',
            options: [],
            currency: 'USD',
            symbol: '$',
            active: false,
            currencies: [],
            max: 10,
            hasPricing: false,
            allowPricing: true
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
        var hasPricing = this.props.hasPricing;
        var allowPricing = this.props.allowPricing;
        var optionPriceFields = [], togglePricingButton, allowMoreOptions = false;
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
                        showPricing={hasPricing}
                    />
                );
            });
            
            allowMoreOptions = optionPriceFields.length < this.props.max;
            
            if (hasPricing) {
                togglePricingButton = <button onClick={trigger('REMOVE PRICING', 'data.hasPricing')}>Remove pricing</button>;
            } else if (allowPricing) {
                togglePricingButton = <button onClick={trigger('ADD PRICING', 'data.hasPricing')}>Add pricing</button>;
            }
        }
        var validator = function(value) {
            if (value.length === 0) {
                return 'Please give a name for this option';
            }
        };
        
        return (
            <div className={className}>
                <EditorWidget mode={mode} trigger={trigger}/>
                {togglePricingButton}
                <TextField disabled={!active} onChange={this.trigger('UPDATE', 'data.name')} label="Option name" value={inputName} className="paypal-input" validators={[validator]}/>
                {optionPriceFields}
                {allowMoreOptions ? <button onClick={this.trigger('CREATE', 'data.options')}>Add option</button> : null }
            </div>
        );
    }
});

var OptionPriceField = React.createClass({
    mixins: [TriggerMixin],
    getDefaultProps: function() {
        return {
            className: 'option-price',
            optionName: '',
            currency: 'USD',
            currencies: [],
            removable: true,
            currencyChangeable: true,
            showPricing: false
        }
    },
    render: function() {
        var className = this.props.className;
        var optionName = this.props.optionName;
        var price = this.props.price;
        var currency = this.props.currency;
        var currencies = this.props.currencies;
        var trigger = this.trigger;
        var ownPath = this.props.jsonPath;
        var currencyChangeable = this.props.currencyChangeable;
        var showPricing = this.props.showPricing;
        var priceComponent, currencyComponent, deleteButton;
        
        if (showPricing) {
            priceComponent = <TextField 
                onChange={trigger('UPDATE', 'price')}
                placeholder="Price"
                className="paypal-input"
                value={price} />;
            if (currencyChangeable) {
                currencyComponent = <CurrencySelect 
                    onChange={trigger('UPDATE', 'currency')} 
                    currencies={currencies} 
                    selected={currency} />;
            } else {
                currencyComponent = <div className="currency-display">{currency}</div>;
            }
        }
        
        if (this.props.removable) {
            deleteButton = <button onClick={trigger('DELETE')}>Delete</button>;
        }
        
        return (
            <div className={className}>
                <TextField 
                    onChange={trigger('UPDATE', 'name')} 
                    placeholder="Option" 
                    className="paypal-input" 
                    value={optionName} />
                {priceComponent}
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
        var currencies = this.props.currencies;
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
    mixins: [TriggerMixin],
    getDefaultProps: function() {
        return {
            className: 'textfield-input-editor',
            inputName: '',
            active: false
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
    mixins: [TriggerMixin],
    getDefaultProps: function() {
        return {
            className: 'editor-widget',
            mode: 'view'
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