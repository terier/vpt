// #package js/main

// #include Accordion.js
// #include Button.js
// #include Checkbox.js
// #include ColorChooser.js
// #include Dropdown.js
// #include Field.js
// #include FileChooser.js
// #include Panel.js
// #include ProgressBar.js
// #include Radio.js
// #include Sidebar.js
// #include Slider.js
// #include Spacer.js
// #include Spinner.js
// #include StatusBar.js
// #include Tabs.js
// #include Textbox.js
// #include VectorSpinner.js

class UI {

static get CLASS_FROM_TYPE() {
    return {
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
        'textbox'       : Textbox,
        'vector'        : VectorSpinner,
    };
}

static create(spec) {
    // I know, no error checking whatsoever... this is for me, not users.
    // TODO: maybe decouple UI creation spec from object creation spec
    //       by adding an 'options' field to this UI creation spec
    if (!(spec.type in UI.CLASS_FROM_TYPE)) {
        throw new Error('Cannot instantiate: ' + spec.type);
    }
    const Class = UI.CLASS_FROM_TYPE[spec.type];
    const object = new Class(spec);
    let binds = {};
    if (spec.bind) {
        binds[spec.bind] = object;
    }

    if (spec.children) {
        for (let childKey in spec.children) {
            const childSpec = spec.children[childKey];
            const returnValue = UI.create(childSpec);
            const childObject = returnValue.object;
            const childBinds = returnValue.binds;
            for (let bind in childBinds) {
                if (bind in binds) {
                    throw new Error('Already bound: ' + bind);
                }
            }
            Object.assign(binds, childBinds);

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

    return { object, binds };
}

}
