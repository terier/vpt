.PHONY: trap
trap:

.PHONY: run
run:
	python -m http.server

.PHONY: all
all: templates shaders

.PHONY: templates
templates:
	cd templates && $(MAKE)

.PHONY: shaders
shaders:
	cd shaders && $(MAKE)

