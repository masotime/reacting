var InputsEditor = React.createClass({
    getDefaultProps: function() {
        return {
            className: 'inputs-editor',
            currency: 'USD',
            symbol: '$'
        };
    },
    componentWillMount: function() {
        if (this.props.inputs) {
            this.setState({inputs: this.props.inputs});
        }
    },
    getInitialState: function() {
        // store the physical dropdown / text editor data
        return {
            inputs: []
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
            var nav = navigate(obj, path.split('.'));
            var obj = nav.obj;
            var key = nav.key;
            if (obj.hasOwnProperty(key)) {
                obj[key] = value;
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
            var current = self.state.inputs;
            console.log('received action',action,'on path',path,'with value',value);
            
            // based on the action, react accordingly
            switch(action) {
                case 'UPDATE':
                    update(current, path, value);
                    break;
                case 'DELETE':
                    remove(current, path);
                    break;
            }
            
            // update the graph
            self.setState({ inputs: current });
            
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
        var className = this.props.className;
        var inputs = this.state.inputs;
        var self = this;
        var inputComponents = inputs.map(function(input, index) {
            switch(input.type) {
                case 'dropdown':
                    return <DropdownInputEditor key={index} jsonPath={index} trigger={self.handle} inputName={input.data.name} currency={input.currency} options={input.data.options} />;
                case 'textfield':
                    return <TextfieldInputEditor key={index} jsonPath={index} trigger={self.handle} inputName={input.data.name} />;
            }
        });
        
        var result = (
            <div className={className}>
                <h3>This is a preview</h3>
                <Preview inputs={inputs} />
                
                <h3>This is the Options Editor</h3>
                <button onClick={this.removeInputs}>Remove all inputs</button>
                {inputComponents}
                <button onClick={this.addDropdownInput}>Add dropdown input</button>
                <button onClick={this.addTextfieldInput}>Add textfield input</button>
            </div>
        );
                
        return result;
    }
});

var Preview = React.createClass({
    getDefaultProps: function() {
        return {
            inputs: []
        };
    },
    render: function() {
        var inputs = this.props.inputs;
        
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
                                            return <option key={index} value={selectOption.price}>{[selectOption.name,input.data.symbol,selectOption.price].join(' ')}</option>;
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
            key: 0
        };    
    },
    trigger: function(action, componentPath) {
        var upstreamTrigger = this.props.trigger,
            ownPath = this.props.jsonPath;
        
        return function onChange(value) {
            var upstreamPath = [ownPath, componentPath].reduce(function (acc, current) {
               return current !== undefined && acc.concat(current.toString().split('.')) || acc;
            }, []).join('.');
            upstreamTrigger && upstreamTrigger(action, upstreamPath)(value);
        };
    },
    render: function() {
        var className = this.props.className;
        var inputName = this.props.inputName;
        var currency = this.props.currency;
        var trigger = this.trigger;
        var optionPriceFields = this.props.options.map(function(optionPrice, index) {
            return (
                <OptionPriceField 
                    key={index} 
                    optionName={optionPrice.name}
                    price={optionPrice.price}
                    currency={currency}
                    jsonPath={'data.options.'+index}
                    trigger={trigger}
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
                <TextField onChange={this.trigger('UPDATE', 'data.name')} label="Option name" value={inputName} className="paypal-input" validators={[validator]}/>
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
    trigger: function(action, componentPath) {
        var upstreamTrigger = this.props.trigger,
            ownPath = this.props.jsonPath;
        
        return function onChange(value) {
            var upstreamPath = [ownPath, componentPath].reduce(function (acc, current) {
               return current !== undefined && acc.concat(current.toString().split('.')) || acc;
            }, []).join('.');
            upstreamTrigger && upstreamTrigger(action, upstreamPath)(value);
        };
    },
    render: function() {
        var className = this.props.className;
        var optionName = this.props.optionName;
        var price = this.props.price;
        var currency = this.props.currency;
        var trigger = this.trigger;
        var ownPath = this.props.jsonPath;
        var deleteButton;
        
        if (this.props.removable) {
            deleteButton = <button onClick={trigger('DELETE')}>Delete</button>
        }
        
        return (
            <div className={className}>
                <TextField onChange={trigger('UPDATE', 'name')} placeholder="Option" className="paypal-input" value={optionName} />
                <TextField onChange={trigger('UPDATE', 'price')} placeholder="Price" className="paypal-input" value={price} />
                <CurrencySelect />
                {deleteButton}
            </div>
        );        
    }
});

var TextfieldInputEditor = React.createClass({
    getDefaultProps: function() {
        return {
            className: 'textfield-option-editor',
            inputName: ''
        };
    },
    trigger: function(action, componentPath) {
        var upstreamTrigger = this.props.trigger,
            ownPath = this.props.jsonPath;
        
        return function onChange(value) {
            var upstreamPath = [ownPath, componentPath].reduce(function (acc, current) {
               return current !== undefined && acc.concat(current.toString().split('.')) || acc;
            }, []).join('.');
            upstreamTrigger && upstreamTrigger(action, upstreamPath)(value);
        };
    },
    render: function () {
        var className = this.props.className;
        var inputName = this.props.inputName;
        var trigger = this.trigger;
        var validator = function(value) {
            if (value.length === 0) {
                return 'Please give a name for this option';
            }
        };
        
        
        return (
            <div className={className}>
                <EditorWidget />
                <TextField label="Option name" className="paypal-input" onChange={trigger('UPDATE', 'data.name')} value={inputName} validators={[validator]}/>
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