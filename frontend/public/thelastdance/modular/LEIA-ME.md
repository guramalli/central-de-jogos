# Personagem modular — protótipo v0.1

## Executar
Na pasta do pacote, rode `python -m http.server 8000` e abra `http://localhost:8000`. Não requer engine nem instalação de dependências JS.

## Funcionalidades
- Quatro direções, com artes originais.
- Frente: recortes independentes de cabeça, tronco, braços, pernas e tênis com rotações esqueléticas simples.
- Recolorização de camiseta e calça sem trocar a imagem do personagem.
- Corpo alto ou largo (escala provisória).
- Controle WASD/setas, animação em 8 a 16 poses por segundo.

## Limitações IMPORTANTES
- Não é um rig de produção final. Os recortes são preliminares e ainda contêm regiões escondidas e junções incompletas.
- Nas vistas de costas e perfis a imagem é inteira, sem rig articulado; há apenas deslocamento vertical na caminhada.
- As roupas são apenas recoloridas; ainda não existem peças de roupa redesenhadas e intercambiáveis.
- O braço com relógio continua sendo um recorte único; não há antebraço e mão independentes.
- A vista frontal tem artefato roxo junto aos tênis, presente na fonte original.
- A animação é um teste de movimento, não um ciclo de marcha final com contato dos pés.

## Próxima etapa para produção
Desenhar/retocar as regiões ocultas e dividir mangas, braços e pernas em articulações completas nas quatro vistas. Exportar máscaras de roupa e sprites com pivôs consistentes. Validar a silhueta com a arte original.
