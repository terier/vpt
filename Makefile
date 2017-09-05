SRC_DIR          := app
DST_DIR          := build

# TODO: make a tool for automatic dependency resolution
INPUT_JS         := Util.js \
                    Ticker.js \
                    AsyncLoader.js \
                    WebGLUtils.js \
                    math/Matrix.js \
                    math/Vector.js \
                    math/Quaternion.js \
                    Camera.js \
                    OrbitCameraController.js \
                    Volume.js \
                    SingleBuffer.js \
                    DoubleBuffer.js \
                    TransferFunctionWidget.js \
                    dialogs/Navbar.js \
                    dialogs/OpenFileDialog.js \
                    dialogs/EAMRendererController.js \
                    dialogs/ISORendererController.js \
                    dialogs/MIPRendererController.js \
                    renderers/AbstractRenderer.js \
                    renderers/EAMRenderer.js \
                    renderers/ISORenderer.js \
                    renderers/MIPRenderer.js \
                    RenderingContext.js \
                    Application.js \
                    main.js
INPUT_JS         := $(addprefix $(SRC_DIR)/js/,$(INPUT_JS))

INPUT_HTML       := $(wildcard $(SRC_DIR)/*.html)
#INPUT_JS         := $(wildcard $(SRC_DIR)/js/*.js) \
#                    $(wildcard $(SRC_DIR)/js/**/*.js)
INPUT_CSS        := $(wildcard $(SRC_DIR)/css/*.css) \
                    $(wildcard $(SRC_DIR)/css/**/*.css)
INPUT_TEMPLATES  := $(wildcard $(SRC_DIR)/templates/*.html) \
                    $(wildcard $(SRC_DIR)/templates/**/*.html)
INPUT_IMAGES     := $(SRC_DIR)/images
INPUT_SHADERS    := $(wildcard $(SRC_DIR)/glsl/*.vert) \
                    $(wildcard $(SRC_DIR)/glsl/**/*.vert) \
                    $(wildcard $(SRC_DIR)/glsl/*.frag) \
                    $(wildcard $(SRC_DIR)/glsl/**/*.frag)
INPUT_MIXINS     := $(wildcard $(SRC_DIR)/glsl/*.glsl) \
                    $(wildcard $(SRC_DIR)/glsl/**/*.glsl)

OUTPUT_HTML      := $(INPUT_HTML:$(SRC_DIR)%=$(DST_DIR)%)
OUTPUT_JS        := $(DST_DIR)/js/main.js
OUTPUT_CSS       := $(DST_DIR)/css/main.css
OUTPUT_TEMPLATES := $(DST_DIR)/js/templates.js
OUTPUT_IMAGES    := $(DST_DIR)/images
OUTPUT_SHADERS   := $(DST_DIR)/js/shaders.js
OUTPUT_MIXINS    := $(DST_DIR)/js/mixins.js

# ---------------------------------------------------------

$(DST_DIR)/%.html: $(SRC_DIR)/%.html
	@echo "Building $@"
	@cp $^ $@

$(OUTPUT_JS): $(INPUT_JS)
	@echo "Building $@"
	@cat $^ > $@

$(OUTPUT_CSS): $(INPUT_CSS)
	@echo "Building $@"
	@cat $^ > $@

$(OUTPUT_TEMPLATES): $(INPUT_TEMPLATES)
	@echo "Building $@"
	@echo "TEMPLATES={" > $@
	@for file in $^; do \
        echo -n "'$$(basename $$file)':'" >> $@ ; \
        cat $$file | tr '\n' ' ' >> $@ ; \
        echo "'," >> $@ ; \
    done
	@echo "};" >> $@

$(OUTPUT_IMAGES): $(INPUT_IMAGES)
	@echo "Building $@"
	@cp -r $^ $@

$(OUTPUT_SHADERS): $(INPUT_SHADERS)
	@echo "Building $@"
	@bin/concader -n SHADERS $^ > $@ 2>/dev/null

$(OUTPUT_MIXINS): $(INPUT_MIXINS)
	@echo "Building $@"
	@bin/concader -x -n MIXINS $^ > $@ 2>/dev/null

# ---------------------------------------------------------

.PHONY: all
all: $(OUTPUT_HTML) \
     $(OUTPUT_JS) \
     $(OUTPUT_CSS) \
     $(OUTPUT_IMAGES) \
     $(OUTPUT_TEMPLATES) \
     $(OUTPUT_SHADERS) \
     $(OUTPUT_MIXINS)

.PHONY: clean
clean:
	@rm -rf $(DST_DIR)

# ---------------------------------------------------------

$(shell mkdir -p $(DST_DIR) $(DST_DIR)/js $(DST_DIR)/css)

.DEFAULT_GOAL := all
