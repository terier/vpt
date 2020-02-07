SRCD := src
DSTD := build

# ---------------------------------------------------------

.PHONY: packages
packages:
	bin/packer

$(DSTD):
	mkdir $(DSTD)

$(DSTD)/index.html: $(SRCD)/index.html | $(DSTD)
	cp $^ $@

$(DSTD)/images: $(SRCD)/images | $(DSTD)
	cp -r $^ $@

# ---------------------------------------------------------

.DEFAULT_GOAL := all
.PHONY: all
all: $(DSTD)/index.html \
     $(DSTD)/images \
     packages

.PHONY: clean
clean:
	rm -rf $(DSTD)

.PHONY: watch
watch:
	bin/watcher make $(SRCD)
