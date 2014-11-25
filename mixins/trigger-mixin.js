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