LAB_DIR := $(if $(LAB),$(LAB),$(CURDIR))
REPO_ROOT := $(CURDIR)
include tools/lab/lab.mk
