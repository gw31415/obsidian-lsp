# obsidian-lsp : Language Server for Obsidian.md

![Screen record](https://github.com/gw31415/obsidian-lsp/assets/24710985/be3e8a1b-230a-4af0-9a0a-ea2e747eed35)

## Motivation

[Obsidian.md](https://obsidian.md/) is a fantastic tool that enables you to
create your own Wiki using Markdown. It's not only convenient but also boasts an
iOS app that makes viewing easy. However, my goal was to further enhance this
experience by allowing the use of any text editor like Neovim. The need for such
flexibility is what led me to the development of this LSP server for
Obsidian.md. It aims to make editing your Obsidian notes more efficient and
flexible, all in your editor of choice.

## Features

The Obsidian.md LSP server provides the following main features:

-   [x] `textDocument/completion`: Provides search within the Vault and
    autocompletion of links, enabling efficient navigation within your wiki.

-   [x] `textDocument/publishDiagnostics`: Detects and alerts you of broken or
    empty links, ensuring the consistency and integrity of your wiki.

-   [x] `textDocument/definition`: Allows you to jump directly to a page from
    its link, aiding swift exploration within your wiki.

-   [x] `textDocument/hover`: Displays the content of the linked article in a
    hover-over preview, saving you the need to follow the link.

-   [ ] `textDocument/references`: (Will) display a list of all articles that
    contain a link to a specific article, helping you understand the context and
relationships of your notes. This feature is currently under development.

-   [ ] `workspace/symbol`: (Will) enable searching for symbols across the
    entire workspace, helping you quickly locate specific topics or keywords.
This feature is currently under development.

The Obsidian.md LSP server makes your Obsidian usage more potent and efficient.
You can edit your Obsidian Wiki in your preferred editor, maximising its
potential.

## Related Projects

-   [obsidian.nvim](https://github.com/epwalsh/obsidian.nvim) : The Neovim
    plugin that inspired this project
