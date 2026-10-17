#!/usr/bin/env python3
"""Gera o GUIA DE FORMA de uma peça do mapa: caixas cinzas no ângulo/escala exatos do jogo, sobre fundo verde.

Uso (a partir de frontend/public/thelastdance/):
    python3 -I tools/guia_props.py <nome> <pasta_saida> [--escala 2]

O guia vai junto como imagem de referência para o gerador de imagem pintar a peça POR CIMA da forma certa:
a arte já sai do tamanho da colisão, no ângulo 2:1 do mapa. Também grava <nome>.json com o ponto da imagem
onde fica a origem da peça (canto x0, y0, z = 0) — é o que o jogo usa para encaixar a arte no lugar.

Projeção igual a js/maps/iso.js: 1 m = 144 px de largura de losango (72 de altura), 1 m de altura = 100 px.
Faces: topo claro, frente-direita (x = x1) média, frente-esquerda (y = y1) escura — luz vindo do alto à direita.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

LARG, ALT, VERT = 144, 72, 100

# Peças do piloto: caixas relativas à origem da peça (metros). A primeira caixa define o tamanho/colisão.
PECAS = {
    "cama": {
        "descricao": "cama de casal com cabeceira encostada na parede do fundo (lado y = 0)",
        "caixas": [
            {"x": (0, 1.9), "y": (0, 2.1), "z": (0, 0.55)},        # colchão/base (colisão)
            {"x": (0, 1.9), "y": (0, 0.1), "z": (0.55, 1.05)},     # cabeceira (sobre a base)
        ],
    },
    "armario": {
        "descricao": "guarda-roupa alto encostado na parede do fundo (y = 0), portas viradas para +y",
        "caixas": [{"x": (0, 0.9), "y": (0, 0.6), "z": (0, 2.1)}],
    },
    "criado_mudo": {
        "descricao": "criado-mudo baixo ao lado da cama, encostado na parede do fundo (y = 0)",
        "caixas": [{"x": (0, 0.5), "y": (0, 0.45), "z": (0, 0.55)}],
    },
    "mesa_computador": {
        "descricao": "mesa encostada na parede da frente-direita (x = 0,7), com monitor virado para dentro do quarto (-x)",
        "caixas": [
            {"x": (0, 0.7), "y": (0, 1.6), "z": (0, 0.75)},        # tampo/mesa (colisão)
            {"x": (0.5, 0.62), "y": (0.3, 1.3), "z": (0.75, 1.3)},  # monitor (de costas para a câmera)
        ],
    },
    "cadeira": {
        "descricao": "cadeira de escritório virada para a mesa (+x), encosto do lado x = 0",
        "caixas": [
            {"x": (0, 0.5), "y": (0, 0.5), "z": (0, 0.5)},          # assento (colisão)
            {"x": (0, 0.1), "y": (0.03, 0.47), "z": (0.5, 1.05)},   # encosto
        ],
    },
    "roupas_chao": {
        "descricao": "roupas e um tênis jogados no chão, bem baixos",
        "caixas": [{"x": (0, 0.8), "y": (0, 0.6), "z": (0, 0.08)}],
    },
    "planta": {
        "descricao": "planta em vaso, alta",
        "caixas": [{"x": (0, 0.45), "y": (0, 0.45), "z": (0, 1.2)}],
    },
    "sofa": {
        "descricao": "sofá de 3 lugares virado para a TV (para -x): da câmera vemos o ENCOSTO (lado x1) e o assento atrás dele",
        "caixas": [
            {"x": (0, 0.9), "y": (0, 2.6), "z": (0, 0.45)},        # base/assento (colisão)
            {"x": (0.65, 0.9), "y": (0, 2.6), "z": (0.45, 0.85)},  # encosto (lado da câmera)
            {"x": (0, 0.65), "y": (0, 0.2), "z": (0.45, 0.65)},    # braço
            {"x": (0, 0.65), "y": (2.4, 2.6), "z": (0.45, 0.65)},  # braço
        ],
    },
    "rack": {
        "descricao": "rack baixo de TV encostado na parede da esquerda (x = 0), frente virada para +x",
        "caixas": [{"x": (0, 0.45), "y": (0, 2.2), "z": (0, 0.5)}],
    },
    "mesa_lateral": {
        "descricao": "mesinha lateral pequena e baixa",
        "caixas": [{"x": (0, 0.5), "y": (0, 0.5), "z": (0, 0.5)}],
    },
    "mesa_redonda": {
        "descricao": "mesa de jantar redonda preta com pé central",
        "caixas": [{"x": (0, 1.1), "y": (0, 1.1), "z": (0, 0.75)}],
    },
    "poltrona": {
        "descricao": "poltrona/cadeira estofada cinza, arredondada (serve em qualquer lado da mesa)",
        "caixas": [{"x": (0, 0.55), "y": (0, 0.55), "z": (0, 0.85)}],
    },
    "aparador": {
        "descricao": "aparador cinza encostado na parede do fundo (y = 0), frente virada para +y",
        "caixas": [{"x": (0, 1.5), "y": (0, 0.45), "z": (0, 0.85)}],
    },
    "luminaria": {
        "descricao": "luminária de piso acobreada, alta e fina",
        "caixas": [{"x": (0, 0.3), "y": (0, 0.3), "z": (0, 1.6)}],
    },
    # ---- padaria (js/maps/padaria_planta.js) ----
    "balcao_modulo": {
        "descricao": "módulo de balcão de padaria (repete lado a lado), frente dos clientes virada para +y",
        "caixas": [{"x": (0, 1.3), "y": (0, 0.6), "z": (0, 1.05)}],
    },
    "vitrine_doces": {
        "descricao": "módulo de vitrine refrigerada de doces (repete lado a lado), vidro virado para +y",
        "caixas": [{"x": (0, 1.3), "y": (0, 0.6), "z": (0, 1.3)}],
    },
    "caixa_registradora": {
        "descricao": "balcão do caixa com registradora e maquininha, frente virada para +y",
        "caixas": [
            {"x": (0, 1.4), "y": (0, 0.7), "z": (0, 1.05)},
            {"x": (0.45, 0.95), "y": (0.1, 0.45), "z": (1.05, 1.35)},  # registradora em cima
        ],
    },
    "maquina_cafe": {
        "descricao": "máquina de café expresso em cima de um móvel, encostada na parede do fundo (y = 0), frente para +y",
        "caixas": [{"x": (0, 0.9), "y": (0, 0.55), "z": (0, 1.45)}],
    },
    "chapa": {
        "descricao": "chapa de lanches (bancada de inox baixa), encostada na parede do fundo, frente para +y",
        "caixas": [{"x": (0, 1.4), "y": (0, 0.6), "z": (0, 0.95)}],
    },
    "estufa_salgados": {
        "descricao": "estufa de salgados de vidro em cima de uma bancada, frente para +y",
        "caixas": [{"x": (0, 0.9), "y": (0, 0.55), "z": (0, 1.3)}],
    },
    "forno_pao": {
        "descricao": "forno de pão de inox alto, encostado na parede do fundo, porta virada para +y",
        "caixas": [{"x": (0, 1.2), "y": (0, 0.7), "z": (0, 1.7)}],
    },
    "geladeira_bebidas": {
        "descricao": "geladeira de bebidas com portas de vidro, encostada na parede da esquerda (x = 0), portas para +x",
        "caixas": [{"x": (0, 0.7), "y": (0, 1.4), "z": (0, 2.0)}],
    },
    "banqueta": {
        "descricao": "banqueta alta redonda de balcão, sem encosto",
        "caixas": [{"x": (0, 0.4), "y": (0, 0.4), "z": (0, 0.75)}],
    },
    "mesa_bistro": {
        "descricao": "mesa quadrada pequena de padaria, tampo claro, pé central",
        "caixas": [{"x": (0, 0.7), "y": (0, 0.7), "z": (0, 0.75)}],
    },
    "mesa_grande": {
        "descricao": "mesa retangular de padaria para 4 pessoas, tampo claro",
        "caixas": [{"x": (0, 1.2), "y": (0, 1.0), "z": (0, 0.75)}],
    },
    "cadeira_bistro": {
        "descricao": "cadeira de padaria de frente para a câmera (assento virado para +y), encosto do lado y = 0",
        "caixas": [
            {"x": (0, 0.45), "y": (0, 0.45), "z": (0, 0.47)},           # assento (colisão)
            {"x": (0.03, 0.42), "y": (0, 0.07), "z": (0.47, 0.95)},     # encosto (atrás)
        ],
    },
    "cadeira_bistro_lado": {  # não se gera: é a cadeira_bistro espelhada (prop_entrada.py --espelhar)
        "descricao": "cadeira de padaria virada para +x (espelho da cadeira_bistro), encosto do lado x = 0",
        "caixas": [
            {"x": (0, 0.45), "y": (0, 0.45), "z": (0, 0.47)},
            {"x": (0, 0.07), "y": (0.03, 0.42), "z": (0.47, 0.95)},
        ],
    },
    "cadeira_bistro_costas": {
        "descricao": "cadeira de padaria de costas para a câmera (assento virado para -x), encosto do lado x = 0,45",
        "caixas": [
            {"x": (0, 0.45), "y": (0, 0.45), "z": (0, 0.47)},
            {"x": (0.38, 0.45), "y": (0.03, 0.42), "z": (0.47, 0.95)},
        ],
    },
    "lixeira": {
        "descricao": "lixeira de inox com tampa de pedal",
        "caixas": [{"x": (0, 0.35), "y": (0, 0.35), "z": (0, 0.6)}],
    },
    # ---- garagem do prédio (js/maps/garagem_planta.js): carros estacionados de ré, frente virada para +y ----
    "carro_x1": {
        "descricao": "SUV compacto cinza do protagonista, estacionado de ré: frente (faróis) virada para +y",
        "caixas": [
            {"x": (0, 1.85), "y": (0, 4.5), "z": (0, 0.95)},          # carroceria (colisão)
            {"x": (0.12, 1.73), "y": (0.45, 3.2), "z": (0.95, 1.6)},  # cabine (capô na frente, y 3.2..4.5)
        ],
    },
    "carro_hatch": {
        "descricao": "hatch vermelho do vizinho, estacionado de ré, frente virada para +y",
        "caixas": [
            {"x": (0, 1.75), "y": (0, 4.0), "z": (0, 0.85)},
            {"x": (0.12, 1.63), "y": (0.3, 2.9), "z": (0.85, 1.5)},
        ],
    },
    "carro_sedan": {
        "descricao": "sedã preto do vizinho, estacionado de ré, frente virada para +y",
        "caixas": [
            {"x": (0, 1.85), "y": (0, 4.8), "z": (0, 0.85)},
            {"x": (0.12, 1.73), "y": (1.0, 3.5), "z": (0.85, 1.45)},
        ],
    },
    "pilar": {
        "descricao": "pilar quadrado de concreto da garagem, faixas amarelas e pretas na base",
        "caixas": [{"x": (0, 0.6), "y": (0, 0.6), "z": (0, 2.6)}],
    },
    # ---- casa do amigo: quintal com churrasqueira e piscina (js/maps/casa_amigo_planta.js) ----
    "churrasqueira": {
        "descricao": "churrasqueira de tijolinho com chaminé, encostada no muro do fundo (y = 0), boca virada para +y",
        "caixas": [
            {"x": (0, 2.0), "y": (0, 0.9), "z": (0, 1.0)},          # base com a grelha (colisão)
            {"x": (0.4, 1.6), "y": (0, 0.6), "z": (1.0, 2.4)},      # coifa e chaminé
        ],
    },
    "bancada_pia": {
        "descricao": "bancada de granito com pia e armário embaixo, encostada no muro do fundo, frente para +y",
        "caixas": [{"x": (0, 2.3), "y": (0, 0.7), "z": (0, 0.95)}],
    },
    "cervejeira": {
        "descricao": "cervejeira alta com porta de vidro, encostada no muro do fundo, porta virada para +y",
        "caixas": [{"x": (0, 0.7), "y": (0, 0.7), "z": (0, 1.6)}],
    },
    "mesa_madeira": {
        "descricao": "mesa comprida de madeira rústica para 8 pessoas",
        "caixas": [{"x": (0, 3.0), "y": (0, 1.2), "z": (0, 0.78)}],
    },
    "banco_madeira": {
        "descricao": "banco comprido de madeira rústica, sem encosto",
        "caixas": [{"x": (0, 3.0), "y": (0, 0.35), "z": (0, 0.45)}],
    },
    "piscina": {
        "descricao": "piscina retangular de azulejo azul, com borda de pedra clara e escadinha de inox",
        "caixas": [{"x": (0, 5.0), "y": (0, 4.0), "z": (0, 0.12)}],
    },
    "espreguicadeira": {
        "descricao": "espreguiçadeira de piscina, encosto levantado do lado y = 0",
        "caixas": [
            {"x": (0, 0.65), "y": (0, 1.8), "z": (0, 0.35)},
            {"x": (0, 0.65), "y": (0, 0.5), "z": (0.35, 0.8)},
        ],
    },
    "guarda_sol": {
        "descricao": "guarda-sol de praia aberto, haste fincada numa base",
        "caixas": [{"x": (0, 0.4), "y": (0, 0.4), "z": (0, 2.4)}],
    },
    "caixa_termica": {
        "descricao": "caixa térmica (cooler) cheia de gelo e latinhas",
        "caixas": [{"x": (0, 0.6), "y": (0, 0.4), "z": (0, 0.45)}],
    },
    "mesa_plastico": {
        "descricao": "mesa quadrada de plástico branca, de bar",
        "caixas": [{"x": (0, 0.8), "y": (0, 0.8), "z": (0, 0.72)}],
    },
    "cadeira_plastico": {
        "descricao": "cadeira de plástico branca de bar, de frente para a câmera (assento para +y), encosto do lado y = 0",
        "caixas": [
            {"x": (0, 0.45), "y": (0, 0.45), "z": (0, 0.45)},
            {"x": (0.03, 0.42), "y": (0, 0.07), "z": (0.45, 0.9)},
        ],
    },
    "cadeira_plastico_lado": {  # não se gera: é a cadeira_plastico espelhada
        "descricao": "cadeira de plástico virada para +x (espelho da cadeira_plastico)",
        "caixas": [
            {"x": (0, 0.45), "y": (0, 0.45), "z": (0, 0.45)},
            {"x": (0, 0.07), "y": (0.03, 0.42), "z": (0.45, 0.9)},
        ],
    },
    "arvore": {
        "descricao": "árvore frondosa de quintal (mangueira), tronco grosso",
        "caixas": [{"x": (0, 1.0), "y": (0, 1.0), "z": (0, 3.2)}],
    },
    # ---- casa do amigo: varanda gourmet (js/maps/casa_amigo_planta.js) ----
    "ilha_marmore": {
        "descricao": "ilha/balcão de bar: base de porcelanato mármore cinza escuro e tampo grosso de madeira clara, "
                     "frente (onde ficam as banquetas) virada para +y",
        "caixas": [
            {"x": (0, 3.0), "y": (0.1, 0.8), "z": (0, 1.0)},       # base de mármore (colisão)
            {"x": (0, 3.0), "y": (0, 0.9), "z": (1.0, 1.12)},      # tampo de madeira, um pouco maior
        ],
    },
    # enfeites que ficam EM CIMA das bancadas e mesas (desenhados centrados no ponto do enfeite, na altura do tampo)
    "enfeite_cerveja": {
        "descricao": "uma garrafa de cerveja âmbar e um copo americano cheio de cerveja com espuma, lado a lado",
        "caixas": [
            {"x": (0, 0.08), "y": (0, 0.08), "z": (0, 0.28)},      # garrafa
            {"x": (0.12, 0.2), "y": (0.04, 0.12), "z": (0, 0.11)},  # copo
        ],
    },
    "enfeite_churrasco": {
        "descricao": "tábua de madeira com picanha fatiada, vinagrete e farofa em potinhos",
        "caixas": [{"x": (0, 0.5), "y": (0, 0.3), "z": (0, 0.07)}],
    },
    "banqueta_corda": {
        "descricao": "banqueta alta preta de corda trançada com encosto baixo, encosto do lado y = 0",
        "caixas": [
            {"x": (0, 0.45), "y": (0, 0.45), "z": (0, 0.75)},
            {"x": (0.03, 0.42), "y": (0, 0.06), "z": (0.75, 1.0)},
        ],
    },
    "churrasqueira_marmore": {
        "descricao": "torre de churrasqueira revestida de mármore cinza escuro com a grelha num nicho de vidro, "
                     "encostada na parede do fundo (y = 0), frente para +y",
        "caixas": [{"x": (0, 1.5), "y": (0, 0.8), "z": (0, 2.4)}],
    },
    "bancada_cozinha": {
        "descricao": "bancada de cozinha encostada na parede do fundo: tampo de mármore, pia com torneira alta, cooktop, "
                     "armários de madeira embaixo; frente para +y",
        "caixas": [{"x": (0, 2.6), "y": (0, 0.65), "z": (0, 0.95)}],
    },
    "nicho_geladeiras": {
        "descricao": "nicho de marcenaria (madeira clara) com cervejeira de porta de vidro e geladeira inox lado a lado, "
                     "armários em cima; encostado na parede do fundo, frente para +y",
        "caixas": [{"x": (0, 1.8), "y": (0, 0.75), "z": (0, 2.3)}],
    },
    "mesa_redonda_madeira": {
        "descricao": "mesa redonda grande de madeira ripada (1,6 m) sobre base de corda trançada azul",
        "caixas": [{"x": (0, 1.6), "y": (0, 1.6), "z": (0, 0.76)}],
    },
    "cadeira_corda": {
        "descricao": "cadeira de corda trançada azul-marinho com braços de madeira e pés de metal bege, de frente para "
                     "a câmera (assento para +y), encosto do lado y = 0",
        "caixas": [
            {"x": (0, 0.6), "y": (0, 0.6), "z": (0, 0.45)},
            {"x": (0.03, 0.57), "y": (0, 0.08), "z": (0.45, 0.85)},
        ],
    },
    "cadeira_corda_costas": {
        "descricao": "a mesma cadeira de corda azul vista de costas: encosto do lado x = 0,6 (perto da câmera), "
                     "assento virado para -x",
        "caixas": [
            {"x": (0, 0.6), "y": (0, 0.6), "z": (0, 0.45)},
            {"x": (0.52, 0.6), "y": (0.03, 0.57), "z": (0.45, 0.85)},
        ],
    },
    "cadeira_corda_lado": {  # não se gera: espelho da cadeira_corda (assento para +x)
        "descricao": "cadeira de corda azul virada para +x (espelho da cadeira_corda)",
        "caixas": [
            {"x": (0, 0.6), "y": (0, 0.6), "z": (0, 0.45)},
            {"x": (0, 0.08), "y": (0.03, 0.57), "z": (0.45, 0.85)},
        ],
    },
    "cadeira_corda_sul": {  # não se gera: espelho da cadeira_corda_costas (assento para -y)
        "descricao": "cadeira de corda azul de costas para a câmera, assento para -y (espelho da cadeira_corda_costas)",
        "caixas": [
            {"x": (0, 0.6), "y": (0, 0.6), "z": (0, 0.45)},
            {"x": (0.03, 0.57), "y": (0.52, 0.6), "z": (0.45, 0.85)},
        ],
    },
    "vaso_planta_grande": {
        "descricao": "vaso alto preto fosco com uma planta grande de folhas largas",
        "caixas": [{"x": (0, 0.6), "y": (0, 0.6), "z": (0, 1.8)}],
    },
    "caixa_som": {
        "descricao": "caixa de som portátil grande de festa, em pé no chão, com anel de luz colorida",
        "caixas": [{"x": (0, 0.42), "y": (0, 0.36), "z": (0, 0.8)}],
    },
    # ---- balada (js/maps/balada_planta.js): frente das peças virada para +y (a face escura do guia) ----
    "balcao_bar": {
        "descricao": "módulo do balcão do bar (repete lado a lado), lado dos clientes virado para +y",
        "caixas": [{"x": (0, 1.3), "y": (0, 0.7), "z": (0, 1.1)}],
    },
    "bar_fundo": {
        "descricao": "módulo do fundo do bar (geladeiras com porta de vidro), encostado na parede, portas para +y",
        "caixas": [{"x": (0, 1.3), "y": (0, 0.6), "z": (0, 1.0)}],
    },
    "sofa_vip": {
        "descricao": "sofá de veludo vermelho do camarote, encosto do lado y = 0, assento virado para +y",
        "caixas": [
            {"x": (0, 2.4), "y": (0, 0.8), "z": (0, 0.45)},
            {"x": (0, 2.4), "y": (0, 0.22), "z": (0.45, 0.95)},
        ],
    },
    "sofa_vip_lado": {  # não se gera: espelho do sofa_vip (encosto do lado x = 0, assento para +x)
        "descricao": "sofá vermelho do camarote encostado na parede da esquerda (espelho do sofa_vip)",
        "caixas": [
            {"x": (0, 0.8), "y": (0, 2.4), "z": (0, 0.45)},
            {"x": (0, 0.22), "y": (0, 2.4), "z": (0.45, 0.95)},
        ],
    },
    "sofa_lounge": {
        "descricao": "sofá de couro preto do lounge, encosto do lado y = 0, assento virado para +y",
        "caixas": [
            {"x": (0, 2.4), "y": (0, 0.8), "z": (0, 0.45)},
            {"x": (0, 2.4), "y": (0, 0.22), "z": (0.45, 0.95)},
        ],
    },
    "sofa_lounge_costas": {
        "descricao": "o mesmo sofá de couro preto visto de costas: encosto do lado y = 0,8 (perto da câmera), assento para -y",
        "caixas": [
            {"x": (0, 2.4), "y": (0, 0.8), "z": (0, 0.45)},
            {"x": (0, 2.4), "y": (0.58, 0.8), "z": (0.45, 0.95)},
        ],
    },
    "sofa_lounge_lado": {  # não se gera: espelho do sofa_lounge (encosto do lado x = 0, assento para +x)
        "descricao": "sofá de couro preto virado para +x (espelho do sofa_lounge)",
        "caixas": [
            {"x": (0, 0.8), "y": (0, 2.4), "z": (0, 0.45)},
            {"x": (0, 0.22), "y": (0, 2.4), "z": (0.45, 0.95)},
        ],
    },
    "mesinha_vip": {
        "descricao": "mesinha baixa do camarote com balde de champanhe",
        "caixas": [{"x": (0, 0.6), "y": (0, 0.6), "z": (0, 0.5)}],
    },
    "mesinha_lounge": {
        "descricao": "mesinha de centro baixa do lounge",
        "caixas": [{"x": (0, 0.8), "y": (0, 0.8), "z": (0, 0.45)}],
    },
    "mesa_alta": {
        "descricao": "mesa alta redonda de balada (bistrô), feita de barril",
        "caixas": [{"x": (0, 0.6), "y": (0, 0.6), "z": (0, 1.05)}],
    },
    "guarda_corpo": {
        "descricao": "módulo de 1 m do guarda-corpo dourado do camarote (repete lado a lado), ao longo de x",
        "caixas": [{"x": (0, 1.0), "y": (0, 0.15), "z": (0, 1.0)}],
    },
    "guarda_corpo_lado": {  # não se gera: espelho do guarda_corpo (ao longo de y)
        "descricao": "módulo do guarda-corpo dourado ao longo de y (espelho do guarda_corpo)",
        "caixas": [{"x": (0, 0.15), "y": (0, 1.0), "z": (0, 1.0)}],
    },
    "cordao_fila": {
        "descricao": "trecho de 1,2 m do cordão da fila: dois postes dourados nas pontas e corda de veludo vermelho",
        "caixas": [{"x": (0, 1.2), "y": (0, 0.15), "z": (0, 1.0)}],
    },
    "pulpito_hostess": {
        "descricao": "púlpito da hostess na entrada, frente para +y",
        "caixas": [{"x": (0, 0.6), "y": (0, 0.6), "z": (0, 1.1)}],
    },
    "palco_borda": {
        "descricao": "módulo de 1,4 m da borda do palco do DJ (repete lado a lado), frente para +y",
        "caixas": [{"x": (0, 1.4), "y": (0, 0.6), "z": (0, 0.45)}],
    },
    "cabine_dj": {
        "descricao": "cabine do DJ, frente (para o público) virada para +y",
        "caixas": [{"x": (0, 2.0), "y": (0, 0.7), "z": (0, 1.2)}],
    },
    "caixa_som_palco": {
        "descricao": "pilha de caixas de som do palco, alto-falantes virados para +y",
        "caixas": [{"x": (0, 0.8), "y": (0, 0.8), "z": (0, 1.9)}],
    },
    "pilar_balada": {
        "descricao": "pilar quadrado escuro da balada com fitas de LED",
        "caixas": [{"x": (0, 0.6), "y": (0, 0.6), "z": (0, 3.4)}],
    },
    "floreira": {
        "descricao": "módulo de 1,4 m de floreira baixa separando o lounge da pista (repete lado a lado)",
        "caixas": [{"x": (0, 1.4), "y": (0, 0.3), "z": (0, 0.9)}],
    },
    "balcao_gv": {
        "descricao": "balcão do guarda-volumes, lado do atendimento virado para +y",
        "caixas": [{"x": (0, 3.0), "y": (0, 0.6), "z": (0, 1.05)}],
    },
    "balcao_guarda_volumes": {  # não se gera: espelho do balcao_gv (ao longo de y, atendimento para +x)
        "descricao": "balcão do guarda-volumes ao longo de y, atendimento virado para +x (espelho do balcao_gv)",
        "caixas": [{"x": (0, 0.6), "y": (0, 3.0), "z": (0, 1.05)}],
    },
    "cabine_fotos": {
        "descricao": "cabine de fotos com cortina, entrada virada para +y",
        "caixas": [{"x": (0, 1.5), "y": (0, 1.4), "z": (0, 2.2)}],
    },
    "parede_2m": {
        "descricao": "trecho de parede do fundo com 2 m de largura e 2,7 m de altura (plano y = 0, de frente para o jogador)",
        "caixas": [
            {"x": (0, 2.0), "y": (-0.15, 0), "z": (0, 2.7)},
        ],
    },
}

CORES = {"topo": (205, 205, 210), "dir": (150, 150, 158), "esq": (105, 105, 114), "linha": (40, 40, 48)}


def tela(x, y, z, e):
    return ((x - y) * LARG / 2 * e, ((x + y) * ALT / 2 - z * VERT) * e)


def faces(c, e):
    (x0, x1), (y0, y1), (z0, z1) = c["x"], c["y"], c["z"]
    T = lambda x, y, z: tela(x, y, z, e)  # noqa: E731
    return [
        ("esq", [T(x0, y1, z0), T(x1, y1, z0), T(x1, y1, z1), T(x0, y1, z1)]),
        ("dir", [T(x1, y0, z0), T(x1, y1, z0), T(x1, y1, z1), T(x1, y0, z1)]),
        ("topo", [T(x0, y0, z1), T(x1, y0, z1), T(x1, y1, z1), T(x0, y1, z1)]),
    ]


def ordem_desenho(caixas):
    """Atrás antes (mesma regra do jogo, js/maps/iso.js): A antes de B se A.x1 <= B.x0 ou A.y1 <= B.y0;
    empate (caixas empilhadas) pela altura da base."""
    restantes, saida = list(caixas), []
    while restantes:
        for c in sorted(restantes, key=lambda k: (k["z"][0], k["x"][0] + k["y"][0])):
            bloqueada = any(o is not c and (o["x"][1] <= c["x"][0] + 1e-9 or o["y"][1] <= c["y"][0] + 1e-9)
                            and not (c["x"][1] <= o["x"][0] + 1e-9 or c["y"][1] <= o["y"][0] + 1e-9)
                            for o in restantes)
            if not bloqueada:
                break
        restantes.remove(c)
        saida.append(c)
    return saida


def main():
    nome, saida = sys.argv[1], Path(sys.argv[2])
    e = float(sys.argv[sys.argv.index("--escala") + 1]) if "--escala" in sys.argv else 2.0
    peca = PECAS[nome]
    pts = [p for c in peca["caixas"] for _, f in faces(c, e) for p in f]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    margem = 0.22  # folga em volta (a arte pode ter detalhes um pouco além da caixa)
    w, h = max(xs) - min(xs), max(ys) - min(ys)
    lado = int(max(w, h) * (1 + 2 * margem))
    ox = (lado - w) / 2 - min(xs)
    oy = (lado - h) / 2 - min(ys)
    im = Image.new("RGB", (lado, lado), (0, 255, 0))
    d = ImageDraw.Draw(im)
    for c in ordem_desenho(peca["caixas"]):
        for nome_face, poli in faces(c, e):
            d.polygon([(x + ox, y + oy) for x, y in poli], fill=CORES[nome_face], outline=CORES["linha"])
    saida.mkdir(parents=True, exist_ok=True)
    im.save(saida / f"{nome}_guia.png")
    c0 = peca["caixas"][0]
    info = {"nome": nome, "descricao": peca["descricao"], "escala_guia": e, "lado_px": lado,
            "origem_px": [round(ox, 1), round(oy, 1)],  # onde cai (0,0,0) da peça, no guia
            "tamanho_m": [c0["x"][1] - c0["x"][0], c0["y"][1] - c0["y"][0], c0["z"][1] - c0["z"][0]],
            "caixas": peca["caixas"]}
    (saida / f"{nome}_guia.json").write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8")
    print(nome, "guia", lado, "x", lado, "origem", info["origem_px"])


if __name__ == "__main__":
    main()
