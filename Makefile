.PHONY: all
all:
	bin/packer

.PHONY: clean
clean:
	rm -rf build

.PHONY: watch
watch:
	bin/watcher bin/packer src
