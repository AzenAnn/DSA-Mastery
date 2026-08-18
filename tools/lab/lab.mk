.PHONY: help doctor validate build run interactive score verify refresh-expected pack clean

LAB_DIR ?= $(if $(LAB),$(LAB),$(CURDIR))
REPO_ROOT ?= $(dir $(lastword $(MAKEFILE_LIST)))/../..
LAB_CLI := node "$(REPO_ROOT)/tools/lab/cli.mjs"
CASE_ARG := $(if $(CASE),--case "$(CASE)",)
TARGET_ARG := $(if $(TARGET),--target "$(TARGET)",)
TASK_ARG := $(if $(TASK),--task "$(TASK)",)
JSON_ARG := $(if $(JSON),--json,)
COLOR_ARG := $(if $(NO_COLOR),--no-color,)

help:
	@$(LAB_CLI) help

doctor:
	@$(LAB_CLI) doctor "$(LAB_DIR)" $(JSON_ARG) $(COLOR_ARG)

validate:
	@$(LAB_CLI) validate "$(LAB_DIR)" $(JSON_ARG) $(COLOR_ARG)

build:
	@$(LAB_CLI) build "$(LAB_DIR)" $(TARGET_ARG) $(JSON_ARG) $(COLOR_ARG)

# run 的“未满分”是学习结果，不是 Make 自身故障；CLI 保证评分完成即返回 0。
run:
	@$(LAB_CLI) run "$(LAB_DIR)" $(CASE_ARG) $(TASK_ARG) $(TARGET_ARG) $(JSON_ARG) $(COLOR_ARG)

interactive:
	@$(LAB_CLI) interactive "$(LAB_DIR)" $(TASK_ARG) $(TARGET_ARG)

# score 是 CI/作者严格入口，未满分返回 1。
score:
	@$(LAB_CLI) score "$(LAB_DIR)" $(CASE_ARG) $(TASK_ARG) $(TARGET_ARG) $(JSON_ARG) $(COLOR_ARG)

verify:
	@$(LAB_CLI) verify "$(LAB_DIR)" $(JSON_ARG) $(COLOR_ARG)

refresh-expected:
	@$(LAB_CLI) refresh-expected "$(LAB_DIR)" $(TASK_ARG) $(if $(WRITE),--write,) $(JSON_ARG) $(COLOR_ARG)

pack:
	@$(LAB_CLI) pack "$(LAB_DIR)" --profile student $(JSON_ARG) $(COLOR_ARG)

clean:
	@$(LAB_CLI) clean "$(LAB_DIR)" $(JSON_ARG) $(COLOR_ARG)
