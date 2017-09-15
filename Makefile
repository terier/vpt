SRC_DIR          := app
LIB_DIR          := lib
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
                    Navbar.js \
                    dialogs/OpenFileDialog.js \
                    dialogs/EAMRendererDialog.js \
                    dialogs/ISORendererDialog.js \
                    dialogs/MIPRendererDialog.js \
                    dialogs/ReinhardToneMapperDialog.js \
                    dialogs/RangeToneMapperDialog.js \
                    renderers/AbstractRenderer.js \
                    renderers/EAMRenderer.js \
                    renderers/ISORenderer.js \
                    renderers/MIPRenderer.js \
                    tonemappers/AbstractToneMapper.js \
                    tonemappers/ReinhardToneMapper.js \
                    tonemappers/RangeToneMapper.js \
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
INPUT_GLSL       := $(wildcard $(SRC_DIR)/glsl/*.vert) \
                    $(wildcard $(SRC_DIR)/glsl/**/*.vert) \
                    $(wildcard $(SRC_DIR)/glsl/*.frag) \
                    $(wildcard $(SRC_DIR)/glsl/**/*.frag) \
					$(wildcard $(SRC_DIR)/glsl/*.glsl) \
                    $(wildcard $(SRC_DIR)/glsl/**/*.glsl)
INPUT_LIB_JS     := jquery-3.2.1.min.js \
                    jquery-ui-1.12.1.min.js \
                    bootstrap-3.3.7.min.js
INPUT_LIB_JS     := $(addprefix $(LIB_DIR)/,$(INPUT_LIB_JS))
INPUT_LIB_CSS    := bootstrap-3.3.7.min.css
INPUT_LIB_CSS    := $(addprefix $(LIB_DIR)/,$(INPUT_LIB_CSS))

OUTPUT_HTML      := $(INPUT_HTML:$(SRC_DIR)%=$(DST_DIR)%)
OUTPUT_JS        := $(DST_DIR)/js/main.js
OUTPUT_CSS       := $(DST_DIR)/css/main.css
OUTPUT_TEMPLATES := $(DST_DIR)/js/templates.js
OUTPUT_IMAGES    := $(DST_DIR)/images
OUTPUT_GLSL      := $(DST_DIR)/js/shaders.js
OUTPUT_LIB_JS    := $(DST_DIR)/js/lib.js
OUTPUT_LIB_CSS   := $(DST_DIR)/css/lib.css

# ---------------------------------------------------------

$(DST_DIR)/%.html: $(SRC_DIR)/%.html
	@echo "Building $@"
	@cp $^ $@

$(OUTPUT_JS): $(INPUT_JS)
	@echo "Building $@"
	@cat $^ | tr -s '[:blank:]' ' ' | tr -s '\n' > $@

$(OUTPUT_CSS): $(INPUT_CSS)
	@echo "Building $@"
	@cat $^ | tr -s '[:blank:]' ' ' | tr -s '\n' > $@

$(OUTPUT_TEMPLATES): $(INPUT_TEMPLATES)
	@echo "Building $@"
	@echo "TEMPLATES={" > $@
	@for file in $^; do \
        echo -n "'$$(basename $$file)':'" >> $@ ; \
        cat $$file | tr -s '[:space:]' ' ' >> $@ ; \
        echo "'," >> $@ ; \
    done
	@echo "};" >> $@

$(OUTPUT_IMAGES): $(INPUT_IMAGES)
	@echo "Building $@"
	@cp -r $^ $@

$(OUTPUT_GLSL): $(INPUT_GLSL)
	@echo "Building $@"
	@cat $^ | tr -s '[:blank:]' ' ' | tr -s '\n' | bin/concader > $@

$(OUTPUT_LIB_JS): $(INPUT_LIB_JS)
	@echo "Building $@"
	@cat $^ | tr -s '[:blank:]' ' ' | tr -s '\n' > $@

$(OUTPUT_LIB_CSS): $(INPUT_LIB_CSS)
	@echo "Building $@"
	@cat $^ | tr -s '[:blank:]' ' ' | tr -s '\n' > $@

# ---------------------------------------------------------

.PHONY: all
all: $(OUTPUT_HTML) \
     $(OUTPUT_JS) \
     $(OUTPUT_CSS) \
     $(OUTPUT_TEMPLATES) \
     $(OUTPUT_IMAGES) \
     $(OUTPUT_GLSL) \
     $(OUTPUT_LIB_JS) \
     $(OUTPUT_LIB_CSS)

.PHONY: clean
clean:
	@rm -rf $(DST_DIR)

# ---------------------------------------------------------

$(shell mkdir -p $(DST_DIR) $(DST_DIR)/js $(DST_DIR)/css)

.DEFAULT_GOAL := all
