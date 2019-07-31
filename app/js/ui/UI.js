//@@../utils
//@@Accordion.js
//@@Button.js
//@@Checkbox.js
//@@ColorChooser.js
//@@Dropdown.js
//@@Field.js
//@@FileChooser.js
//@@Panel.js
//@@ProgressBar.js
//@@Radio.js
//@@Sidebar.js
//@@Slider.js
//@@Spacer.js
//@@Spinner.js
//@@StatusBar.js
//@@Tabs.js

var UI = (function() {
'use strict';

var CLASS_FROM_TYPE = {
    'accordion'     : Accordion,
    'button'        : Button,
    'checkbox'      : Checkbox,
    'color-chooser' : ColorChooser,
    'dropdown'      : Dropdown,
    'field'         : Field,
    'file-chooser'  : FileChooser,
    'panel'         : Panel,
    'progress-bar'  : ProgressBar,
    'radio'         : Radio,
    'sidebar'       : Sidebar,
    'slider'        : Slider,
    'spacer'        : Spacer,
    'spinner'       : Spinner,
    'status-bar'    : StatusBar,
    'tabs'          : Tabs,
};

function create(spec) {
    // I know, no error checking whatsoever... this is for me, not users.
    // TODO: maybe decouple UI creation spec from object creation spec
    //       by adding an 'options' field to this UI creation spec
    if (!(spec.type in CLASS_FROM_TYPE)) {
        throw new Error('Cannot instantiate: ' + spec.type);
    }
    var Class = CLASS_FROM_TYPE[spec.type];
    var object = new Class(spec);
    var binds = {};
    if (spec.bind) {
        binds[spec.bind] = object;
    }

    if (spec.children) {
        for (var childKey in spec.children) {
            var childSpec = spec.children[childKey];
            var returnValue = create(childSpec);
            var childObject = returnValue.object;
            var childBinds = returnValue.binds;
            for (var bind in childBinds) {
                if (bind in binds) {
                    throw new Error('Already bound: ' + bind);
                }
            }
            CommonUtils.extend(binds, childBinds);

            // TODO: maybe refactor .add()?
            switch (spec.type) {
                case 'tabs':
                    object.add(childKey, childObject);
                    break;
                case 'accordion':
                case 'field':
                case 'panel':
                case 'sidebar':
                    object.add(childObject);
                    break;
            }
        }
    }

    return {
        object : object,
        binds  : binds
    };
}

return {
    create: create
};

})();
