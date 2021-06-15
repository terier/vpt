.PHONY: all
all:
	bin/packer

.PHONY: clean
clean:
	rm -rf build

.PHONY: serve
serve:
	bin/server-node

.PHONY: watch
watch:
	bin/watcher bin/packer src
