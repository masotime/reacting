// provides a way to cascade mutation events from nested components to the top level component
// A deeply nested component that receives a state-mutating event should bind it with the "trigger" higher-order
// function (that returns a function) bound to an action and a _relative_ path of the JSON tree structure to be
// affected. The parent component's jsonPath prop will be combined with the child component and both an "action"
// (similar to a RESTful verb) and a "value" is cascaded up.
//
// For example, assuming that <Container> contains a JSON state object with the following structure:
// {
//   data: {
//     names: [ { firstName: 'someName' } ]
//   }
// }      
//
// <Container> render():
//   <Component1 jsonPath="data" trigger={this.handleWith(this.handler)} />
//
// <Component1> render():
//   <Component2 jsonPath="names.0" trigger={this.trigger} />
//
// <Component2> render():
//   <input type="text" onChange="{trigger('UPDATE', 'firstName')}" />
//
// when there is change event in the nested <input> component in Component2,
// it cascades up to Component1 (which is a passthrough) and prepends "names.0", and finally at
// Container it is received under the "handler" function as "inputs.names.0.firstName" with the action "UPDATE"
// and the value representing the first argument for the onChange handler (in this case the DOM event e)
//
// Notes: 
// 1. All nested components must declare a "trigger" prop bound to the trigger mixin method so that
// events can be cascaded upwards. In this example, <Container> is the top of the hierarchy and doesn't need it
// 2. A jsonPath definition not not necessary on all points in the hierarchy. If not defined, nothing is prepended
// in the propagating chain.
// 3. Only the lowest level component that receives the event should use the trigger(ACTION,PATH) syntax.
// Intermediate components should simply supply the trigger higher order function directly without invoking it.
//
// handleWith is a convenience method that invokes the handler function passed in with the arguments
// (path, action, value, util), where util is a convenience object that provides functions such as navigate,
// update and remove. For example, given the above, we can write the handler as follows:
//
// function handler(path, action, value, util) {
//    var state = this.state;
//    var domEvent = value;
//    if (action === 'UPDATE') util.update(state, path, domEvent.target.value);
//    this.setState(state);
// }
//
// the update utility function will automatically traverse to data.names[0].firstName and update
// it as appropriate.
var TriggerMixin = (function () {

    // these are utility functions that are agnostic to "this"
    function navigate(obj, trail) {
        if (trail.length <= 1 || !obj.hasOwnProperty(trail[0])) {
            return { obj: obj, key: trail[0] };
        } else {
            return navigate(obj[trail[0]], trail.slice(1));
        }
    }
    
    function update(obj, path, value) {
        var parts = path.split('.');
        var nav = navigate(obj, parts);
        if (nav.obj.hasOwnProperty(nav.key)) {
            nav.obj[nav.key] = value;
        } else if (parts.length > 1) {
            path = parts.slice(0,-2).concat([parts[parts.length-1]]).join('.');            
            console.log('Key not found, trying',path,'instead');
            update(obj, path, value);
        }
    }

    function remove(obj, path) {
        var nav = navigate(obj, path.split('.'));
        var obj = nav.obj;
        var key = nav.key;

        // respond according to the type
        if (Array.isArray(obj)) {
            obj.splice(key,1);
        } else {
            delete obj.key;
        }
    }    

    var util = {
        navigate: navigate,
        update: update,
        remove: remove
    };

    return {
        trigger: function(action, componentPath) {
            var upstreamTrigger = this.props.trigger,
                ownPath = this.props.jsonPath;

            return function onChange(value) {
                var upstreamPath = [ownPath, componentPath].reduce(function (acc, current) {
                    var wellFormedPath = current !== undefined && current.toString().length > 0;
                    return wellFormedPath && acc.concat(current.toString().split('.')) || acc;
                }, []).join('.');
                upstreamTrigger && upstreamTrigger(action, upstreamPath)(value);
            };
        },
        handleWith: function handleWith(handler) {
            return function cascader(action, path) {
                return function handle(value) {
                    // React automagically binds "this" to the function so we don't have to care
                    // about this references in the handler
                    handler(action, path, value, util);
                }
            }
        }
    };
}());

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
    removeInputs: function() {
        this.setState({inputs: []});
    },
    handler: function(action, path, value, util) {
        var current = this.state;
        console.log('received action',action,'on path',path,'with value',value);

        // based on the action, react accordingly
        switch(action) {
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
        }

        // update the graph
        this.setState(current);
        
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
    addDropdownInput: function() {
        var currentInputs = this.state.inputs,
            hasPricingIndex = this.getDropdownWithPricing(),
            newDropdownInput = { 
                type: 'dropdown',
                data: {
                    name: '',
                    hasPricing: hasPricingIndex === -1, // pricing only allowed if no other dropdown has pricing
                    options: [
                        { name: '', pricing: '' }, // pricing will be hidden if !hasPricing
                        { name: '', pricing: '' }
                    ]
                }
            };

        currentInputs.push(newDropdownInput);
        this.setState({inputs: currentInputs, activeIndex: currentInputs.length-1});
    },
    addTextfieldInput: function() {
        var currentInputs = this.state.inputs;
        currentInputs.push({
            type: 'textfield',
            data: {
                name: ''
            }
        });
        this.setState({inputs: currentInputs, activeIndex: currentInputs.length-1});
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
        var handler = this.handleWith(this.handler);
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
                        trigger={handler} 
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
                        trigger={handler} 
                        inputName={input.data.name} 
                    />);
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