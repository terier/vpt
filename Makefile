.PHONY: all
all: templates shaders

.PHONY: run
run:
	python -m http.server

.PHONY: templates
templates:
	cd templates && $(MAKE)

.PHONY: shaders
shaders:
	cd shaders && $(MAKE)
