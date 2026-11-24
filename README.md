# RICK BRIDGE PROJECT v2

Um único projeto, com modo local prioritário e modo remoto experimental. Compartilhe explicitamente arquivos com a IA sem abrir o disco inteiro, sem cookies do ChatGPT e sem contratar uma API de modelos separada.

## Windows — modo local (recomendado)

1. Instale Python 3.10+ com o launcher `py` e Tkinter. Instale o Codex CLI e faça login com sua conta ChatGPT (não é necessária uma chave de API para o login por assinatura).
2. Extraia ou clone o projeto em uma pasta fixa. Execute `RICK-CODEX-SETUP.bat` uma vez; confira `codex mcp list`.
3. Execute `RICK-LOCAL.bat`, selecione arquivos e confirme o compartilhamento. Abra uma nova sessão local do Codex e peça: **Use o RICK Bridge para listar os arquivos que compartilhei e analisar o arquivo escolhido.**
4. Para revogar uma cópia, use `py -3 local/bridge.py list` e `py -3 local/bridge.py revoke ID`. Para remover cópias expiradas, use `py -3 local/bridge.py cleanup`.

O compartilhamento usa cópias locais em `%LOCALAPPDATA%/RickBridge/inbox`, com validade padrão de 30 minutos, máximo 100 MiB por arquivo. A expiração bloqueia a leitura; a exclusão física requer cleanup/revoke. O servidor MCP stdio expõe apenas listagem, metadados e leitura; não executa comandos, não varre seu disco e não modifica arquivos de origem. Textos até 2 MiB (saída limitada a 120 mil caracteres) e imagens até 4 MiB são lidos inline. PDF, planilhas e outros binários exigem anexar pelo ChatGPT ou abrir o original no Codex. O processamento pela IA envia o conteúdo selecionado ao serviço conforme as condições do plano; não é IA offline.

Linux/macOS: `python3 local/bridge.py share /caminho/arquivo`, `codex mcp add rick-bridge -- python3 /caminho/absoluto/local/bridge.py serve`. Para abrir o seletor gráfico, use `python3 local/bridge.py pick` (Tkinter).

## ChatGPT Desktop

O protocolo local também pode ser incorporado a um plugin desktop. A instalação depende do suporte da sua conta e da disponibilidade da interface de plugins locais; o pacote não está publicado no diretório oficial. Veja `plugin.json` e `mcp.json` e a documentação [de plugins locais](https://developers.openai.com/plugins/build/plugins). Não é uma conexão com esta conversa web. Codex local é o caminho de homologação prioritário. Não confunda assinatura ChatGPT com créditos da API; uso sujeito aos limites do plano.

## Modo remoto experimental

O servidor Next.js original permanece na raiz, separado logicamente de `local/`. Veja [CLOUD.md](CLOUD.md) para configuração da Vercel, Blob privado, REST, tokens temporários e cliente Windows remoto. O acesso MCP remoto no ChatGPT pessoal não é garantido. Não faça deploy antes de validar dependências, configurar segredos e conferir custos/quotas. Nenhum segredo é necessário no modo local. Não use dados de clientes sem autorização. Um link temporário é uma credencial de acesso e não deve ser divulgado.

## Testes

`python -m unittest discover -s tests -v` (sem dependências externas). `npm install && npm run build` valida o modo remoto, que requer dependências externas e homologação real no Blob privado. Testes do protocolo não equivalem à homologação no Codex ou no ChatGPT Desktop.
