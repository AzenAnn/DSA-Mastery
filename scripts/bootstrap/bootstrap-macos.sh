#!/usr/bin/env bash

set -euo pipefail

readonly DEFAULT_REPO_URL="https://github.com/AzenAnn/DSA-Mastery.git"
readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly LOCAL_SETUP="${SCRIPT_DIR}/setup.mjs"
readonly LOCAL_REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"

repo_dir=""
repo_url="$DEFAULT_REPO_URL"
check_only=false

for argument in "$@"; do
  case "$argument" in
    --check-only|--check-only=true)
      check_only=true
      ;;
    --repo-dir=*)
      repo_dir="${argument#*=}"
      ;;
    --repo-url=*)
      repo_url="${argument#*=}"
      ;;
  esac
done

arguments=("$@")
for ((index = 0; index < ${#arguments[@]}; index += 1)); do
  case "${arguments[index]}" in
    --repo-dir)
      if (( index + 1 >= ${#arguments[@]} )); then
        echo "--repo-dir 缺少路径" >&2
        exit 2
      fi
      repo_dir="${arguments[index + 1]}"
      index=$((index + 1))
      ;;
    --repo-url)
      if (( index + 1 >= ${#arguments[@]} )); then
        echo "--repo-url 缺少地址" >&2
        exit 2
      fi
      repo_url="${arguments[index + 1]}"
      index=$((index + 1))
      ;;
  esac
done

if [[ -z "$repo_dir" ]]; then
  if [[ -f "$LOCAL_SETUP" ]]; then
    repo_dir="$LOCAL_REPO_ROOT"
  else
    repo_dir="$(pwd)/DSA-Mastery"
  fi
fi
if [[ "$repo_dir" != /* ]]; then
  repo_dir="$PWD/$repo_dir"
fi

find_brew() {
  if command -v brew >/dev/null 2>&1; then
    command -v brew
  elif [[ -x /opt/homebrew/bin/brew ]]; then
    echo /opt/homebrew/bin/brew
  elif [[ -x /usr/local/bin/brew ]]; then
    echo /usr/local/bin/brew
  fi
}

refresh_brew_path() {
  local brew_command="$1"
  eval "$("$brew_command" shellenv)"
  hash -r
}

ensure_homebrew() {
  local brew_command
  brew_command="$(find_brew || true)"
  if [[ -n "$brew_command" ]]; then
    refresh_brew_path "$brew_command"
    echo "[toolchain] 复用 Homebrew：$brew_command"
    return
  fi
  if [[ "$check_only" == true ]]; then
    echo "[toolchain] check-only：未找到 Homebrew，不执行安装" >&2
    return 1
  fi
  if ! command -v curl >/dev/null 2>&1; then
    echo "未找到 Homebrew 或 curl；请按 docs/MACOS_STUDENT_SETUP_GUIDE.md 手工安装。" >&2
    exit 10
  fi
  local temporary_directory
  temporary_directory="$(mktemp -d "${TMPDIR:-/tmp}/dsa-mastery-brew.XXXXXX")"
  trap 'rm -rf "$temporary_directory"' EXIT
  echo "Homebrew 尚未安装，将从官方地址下载安装脚本：https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh"
  curl -fsSL "https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh" -o "$temporary_directory/install-homebrew.sh"
  /bin/bash "$temporary_directory/install-homebrew.sh"
  brew_command="$(find_brew || true)"
  if [[ -z "$brew_command" ]]; then
    echo "Homebrew 安装完成后当前终端仍找不到 brew；请打开新终端后重试。" >&2
    exit 12
  fi
  refresh_brew_path "$brew_command"
}

node_is_ready() {
  command -v node >/dev/null 2>&1 || return 1
  node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 22 || (major === 22 && minor >= 13) ? 0 : 1)' >/dev/null 2>&1
}

ensure_node() {
  if node_is_ready; then
    return
  fi
  if [[ "$check_only" == true ]]; then
    echo "check-only：Node.js 不满足 >= 22.13.0；未执行安装。" >&2
    exit 14
  fi
  ensure_homebrew
  local brew_command
  brew_command="$(find_brew)"
  "$brew_command" install node
  refresh_brew_path "$brew_command"
  if ! node_is_ready; then
    echo "Node.js 安装后仍未满足 >= 22.13.0；请打开新终端后重试。" >&2
    exit 12
  fi
}

ensure_git() {
  if command -v git >/dev/null 2>&1; then
    return
  fi
  if [[ "$check_only" == true ]]; then
    echo "check-only：未找到 Git；未执行安装。" >&2
    exit 14
  fi
  ensure_homebrew
  local brew_command
  brew_command="$(find_brew)"
  "$brew_command" install git
  refresh_brew_path "$brew_command"
}

valid_repository() {
  [[ -f "$1/package.json" && -f "$1/pnpm-lock.yaml" && -d "$1/labs" && -f "$1/tools/lab/cli.mjs" && -f "$1/scripts/bootstrap/setup.mjs" ]]
}

prepare_external_repository() {
  if [[ -f "$LOCAL_SETUP" ]]; then
    return
  fi
  if [[ "$check_only" == true ]]; then
    if ! valid_repository "$repo_dir"; then
      echo "从仓库外执行 --check-only 时，必须提供已经存在的有效仓库：$repo_dir" >&2
      exit 13
    fi
    return
  fi
  if [[ -e "$repo_dir" ]]; then
    if valid_repository "$repo_dir"; then
      return
    fi
    if [[ -n "$(find "$repo_dir" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]]; then
      echo "目标目录不为空且不是 DSA Mastery 仓库，不会覆盖：$repo_dir" >&2
      exit 13
    fi
  else
    mkdir -p "$(dirname -- "$repo_dir")"
  fi
  ensure_git
  git clone "$repo_url" "$repo_dir"
  if ! valid_repository "$repo_dir"; then
    echo "clone 完成但未找到共享 setup.mjs：$repo_dir" >&2
    exit 13
  fi
}

ensure_node
ensure_git
prepare_external_repository

setup_path="$LOCAL_SETUP"
if [[ ! -f "$setup_path" ]]; then
  setup_path="$repo_dir/scripts/bootstrap/setup.mjs"
fi

if [[ ! -f "$setup_path" ]]; then
  echo "找不到 DSA Mastery setup.mjs：$setup_path" >&2
  exit 13
fi

# 始终传入解析后的绝对路径；Node 协调器负责 profile、CMake、pnpm、IDE 和 smoke 阶段。
exec node "$setup_path" "$@" --repo-dir "$repo_dir"
