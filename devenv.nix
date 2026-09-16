{...}: {
  languages = {
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

  enterTest = ''
    node --version
  '';
}
