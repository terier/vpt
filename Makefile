.PHONY: all
all:
	node bin/packer

.PHONY: clean
clean:
	rm -rf build

.PHONY: serve
serve:
	node bin/server-node

.PHONY: watch
watch:
	node bin/watcher 'node bin/packer' src
