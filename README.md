# [VPT: The Volumetric Path Tracing Framework](http://lgm.fri.uni-lj.si/research/volumetric-path-tracing-framework/)

VPT is a volumetric path tracing framework targeted towards interactive
real-time data exploration. It works in both desktop and mobile environments.
It is built on top of WebGL 2 with no external dependencies.

![VPT](src/images/screenshot.jpg)

Visit the [portfolio page](http://lgm.fri.uni-lj.si/research/volumetric-path-tracing-framework/) for more information.

## Building and running

You need only `node` to build the framework and to run it.

```bash
bin/packer
bin/server-node
```

There's a working build with a few demo datasets available [here](http://lgm.fri.uni-lj.si/~ziga).

## License

This project is licensed under the **GNU General Public License, version 3**.
See [LICENSE](LICENSE) for details.


## Citation
[Real-Time Interactive Platform-Agnostic Volumetric Path Tracing in WebGL 2.0](https://dl.acm.org/doi/10.1145/3208806.3208814)

Bibtex:
```
@inproceedings{Lesar2018,
    author = {Lesar, {\v{Z}}iga and Bohak, Ciril and Marolt, Matija},
    title = {Real-Time Interactive Platform-Agnostic Volumetric Path Tracing in WebGL 2.0},
    booktitle = {Proceedings of the 23rd International ACM Conference on 3D Web Technology},
    year = {2018},
    isbn = {9781450358002},
    publisher = {Association for Computing Machinery},
    address = {New York, NY, USA},
    doi = {10.1145/3208806.3208814},
}
```
