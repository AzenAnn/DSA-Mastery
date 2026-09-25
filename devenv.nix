{pkgs, ...}: {
  languages = {
    c = {
      enable = true;
      lsp.enable = true;
    };
    cplusplus = {
      enable = true;
      lsp.enable = true;
    };
    javascript = {
      enable = true;
      nodejs.enable = true;
      corepack.enable = true;
      lsp.enable = true;
    };
    typescript = {
      enable = true;
      lsp.enable = true;
    };
  };

  env = {
    CMAKE_GENERATOR = "Ninja";
    CMAKE_CXX_COMPILER_LAUNCHER = "ccache";
  };

  packages = with pkgs; [
    ccache
    ninja
  ];

  enterTest = ''
    node --version
    clang++ --version
    cmake --version
    ninja --version
    make --version
    ccache --version
  '';
}
