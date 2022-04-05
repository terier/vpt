import { Accordion } from './Accordion.js';
import { Button } from './Button.js';
import { Checkbox } from './Checkbox.js';
import { ColorChooser } from './ColorChooser.js';
import { Dropdown } from './Dropdown.js';
import { Field } from './Field.js';
import { FileChooser } from './FileChooser.js';
import { Panel } from './Panel.js';
import { ProgressBar } from './ProgressBar.js';
import { Radio } from './Radio.js';
import { Sidebar } from './Sidebar.js';
import { Slider } from './Slider.js';
import { Spacer } from './Spacer.js';
import { Spinner } from './Spinner.js';
import { StatusBar } from './StatusBar.js';
import { Tabs } from './Tabs.js';
import { Textbox } from './Textbox.js';
import { TransferFunction } from './TransferFunction.js';
import { VectorSpinner } from './VectorSpinner.js';

export class UI {

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
        'transfer-function' : TransferFunction,
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
