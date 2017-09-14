# VOLUMETRIC PATH TRACING

## Building the app

* make

## Running the app

* Featurefull server:
  * bin/server-express
* Fast static file servers:
  * bin/server-node
  * bin/server-python

## Adding dialogs

1. Add js/dialogs/_____Dialog.js
2. Add css/dialogs/_____Dialog.css
3. Add templates/dialogs/_____Dialog.html
4. Add button in Navbar.html
5. Add instance in Application.js
6. Add handling in Navbar.js

## TODO

High priority:

* VPTRenderer
* AbstractToneMapper

Normal priority:

* Input ownership (volume for renderers, frame for tone mappers)
* Dialog abstraction layer
* Revisit inheritance

Low priority:

* Automatic dependency resolution tool
* Non-blocking file processing
* Remove dependencies:
  * Create own draggable
  * Create own stylesheet
* Clean up unused code
* Shader compiler
* Scaffolding scripts
