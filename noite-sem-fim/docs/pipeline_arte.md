# Pipeline de arte — Higgsfield → jogo (provisório, FASE 0)

Decisão do usuário (16/10/2026): **sem engine; jogo feito por IA**. O código é escrito pela IA programadora, em Canvas 2D
e JavaScript puro. Os **arquivos gráficos vêm do Higgsfield**.

Nesta sessão não há conector do Higgsfield, então o fluxo é:

1. **IA programadora** escreve a ficha de cada imagem: o que gerar, ângulo, pose, enquadramento e referências a anexar.
2. **Usuário** gera no Higgsfield e envia os arquivos **originais, sem editar**.
3. **IA programadora** guarda o original intacto, valida com `tools/verificar_asset.py`, faz recorte e limpeza quando
   necessário, padroniza canvas e pivô e monta a folha de comparação para aprovação.
4. **Usuário** aprova ou pede nova geração. Nada entra no jogo sem aprovação.

## Regras de entrega de cada arquivo (o verificador checa as marcadas com ✔)

| Regra | Por quê |
|---|---|
| ✔ **PNG** (nunca JPEG/WebP com perdas como fonte) | A compressão com perdas suja as bordas do recorte |
| ✔ **Fundo transparente real**, se o Higgsfield oferecer. Se não oferecer: **fundo liso magenta #FF00FF**, sem textura, sem degradê e sem sombra | O magenta não aparece no personagem (garrafa verde, jeans azul, camisa preta, tênis branco), então dá para recortar limpo |
| ✔ Figura **inteira**, com pés e cabelo, e **margem livre** em volta | Corte na borda impede recentralizar o pivô |
| ✔ Figura com **pelo menos ~1000 px de altura** (fonte mestre) | O escopo proíbe sprite de baixa resolução; o tamanho de jogo sai por redução |
| ✔ Sem halo/franja semitransparente de fundo | Aparece como contorno claro sobre o cenário neon |
| **Uma vista ou pose por arquivo**, sem texto, sem legenda, sem sombra de chão, sem cenário | A sombra é separada (escopo, FASE 1) |
| Mesmo ângulo de câmera e mesma direção de luz em todo o conjunto | Depende da projeção (D-A6) |
| Cuidado com o **"falso transparente"**: xadrez cinza/branco pintado dentro da imagem | Muito comum em imagens geradas; o verificador recusa (sem alpha) |

## Nomes e pastas

```
assets/characters/protagonist/source/higgsfield/   originais exatamente como saíram (+ .txt com prompt e configurações)
assets/characters/protagonist/directions/          vistas limpas e aprovadas:  protagonista_<pose>_<dir>_v<NN>.png
assets/characters/protagonist/animations/          quadros de animação (FASE 2)
```

Direções: `S` (frente), `SE`, `E`, `NE`, `N` (costas), `NO`, `O`, `SO`. Exemplo: `protagonista_parado_SE_v01.png`.

## Riscos conhecidos de arte gerada por IA (vistos na prancha de referência)

- O rosto muda de uma geração para outra; precisa de folha comparativa ao lado do conceito e da foto.
- Acessório troca de mão ou se duplica (a garrafa duplicou nas vistas de costas e de perfil da prancha).
- Cor da roupa varia (camisa preta × azul-marinho × castanha na prancha).
- Proporção cabeça/corpo varia entre gerações.
- Animação feita a partir de vídeo gerado (FASE 2) tende a ter borrão, câmera que se mexe e pivô tremendo; os quadros
  precisarão de estabilização e checagem de pés.
- Mapa (FASE 4): o gerador entrega imagem achatada. Piso, paredes de fundo, paredes frontais cortadas e móveis
  precisarão ser gerados **em peças separadas** para existir oclusão e transparência dinâmica.

## Uso de `tools/verificar_asset.py`

```bash
python3 -I tools/verificar_asset.py assets/characters/protagonist/source/higgsfield/*.png --altura-min 900
```

Mostra PASSOU/FALHOU por regra e sai com código 1 se algum arquivo falhar. Os limites ficam provisórios até a decisão D-A4.
