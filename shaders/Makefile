SHADERS=$(wildcard *.frag *.vert)
MIXINS=$(wildcard *.glsl)

.PHONY: all
all: MIXINS.js SHADERS.js

MIXINS.js: $(MIXINS)
	../bin/concader -x -n MIXINS $^ > $@

SHADERS.js: $(SHADERS)
	../bin/concader -n SHADERS $^ > $@

clean:
	rm SHADERS.js MIXINS.js
