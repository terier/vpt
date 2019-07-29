SRC_DIR          := app
DST_DIR          := build

INPUT_JS         := $(shell bin/list-dependencies $(SRC_DIR)/js/main.js)
INPUT_HTML       := $(wildcard $(SRC_DIR)/*.html)
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

OUTPUT_HTML      := $(INPUT_HTML:$(SRC_DIR)%=$(DST_DIR)%)
OUTPUT_JS        := $(DST_DIR)/js/main.js
OUTPUT_CSS       := $(DST_DIR)/css/main.css
OUTPUT_TEMPLATES := $(DST_DIR)/js/templates.js
OUTPUT_IMAGES    := $(DST_DIR)/images
OUTPUT_GLSL      := $(DST_DIR)/js/shaders.js

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
	@bin/build-templates $^ > $@

$(OUTPUT_IMAGES): $(INPUT_IMAGES)
	@echo "Building $@"
	@cp -r $^ $@

$(OUTPUT_GLSL): $(INPUT_GLSL)
	@echo "Building $@"
	@cat $^ | tr -s '[:blank:]' ' ' | tr -s '\n' | bin/concader > $@

# ---------------------------------------------------------

.PHONY: all
all: $(OUTPUT_HTML) \
     $(OUTPUT_JS) \
     $(OUTPUT_CSS) \
     $(OUTPUT_TEMPLATES) \
     $(OUTPUT_IMAGES) \
     $(OUTPUT_GLSL)

.PHONY: clean
clean:
	@rm -rf $(DST_DIR)

# ---------------------------------------------------------

$(shell mkdir -p $(DST_DIR) $(DST_DIR)/js $(DST_DIR)/css)

.DEFAULT_GOAL := all
