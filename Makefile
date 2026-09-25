LAB_DIR := $(if $(LAB),$(LAB),$(CURDIR))
REPO_ROOT := $(CURDIR)
include packages/lab-cli/lab.mk
