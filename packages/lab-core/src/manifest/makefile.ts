/** 仓库内 Lab 的薄 Makefile：`../../../../` 对应 labs/chapter-NN/<category>/<lab>/ 的深度。 */
export const THIN_MAKEFILE =
  "LAB_DIR := $(CURDIR)\nREPO_ROOT := $(LAB_DIR)/../../../..\ninclude ../../../../packages/lab-cli/lab.mk\n";

/** 学生包是自包含的：判题内核和 lab.mk 都躺在 Lab 目录里，不依赖仓库布局。 */
export const STANDALONE_MAKEFILE =
  "LAB_DIR := $(CURDIR)\nREPO_ROOT := $(LAB_DIR)\nLAB_CLI_JS := $(LAB_DIR)/lab-cli.js\ninclude lab.mk\n";

/** 学生包里判题内核的文件名，`STANDALONE_MAKEFILE` 与打包逻辑共用。 */
export const STANDALONE_CLI_FILENAME = "lab-cli.js";
