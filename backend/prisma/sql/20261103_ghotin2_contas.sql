-- ===== Ghotin2 (jogo em /ghotin2/): contas só do jogo, save na nuvem e ranking — 03/11/2026 =====
-- Gerado com:
--   npx prisma migrate diff --from-schema-datamodel <schema.prisma de antes> \
--     --to-schema-datamodel prisma/schema.prisma --script
-- SÓ ACRESCENTA: três tabelas novas (Ghotin2Conta, Ghotin2Personagem, Ghotin2Comum), os índices e as chaves
-- estrangeiras DELAS (entre elas mesmas; nenhuma ligação com "User"). Não altera nem apaga nada que já existe.
--
-- Como o 20261014_jocelino_save.sql: o banco de produção (Neon) recebe o schema por "npx prisma db push", rodado à mão
-- (prisma/migrations/ está parada desde 08/2026 e travada em "sqlite"). Este arquivo serve para conferir/aplicar à mão
-- (psql ou o SQL Editor do Neon) se preferir não usar o db push. Os dois dão o mesmo resultado.
-- Conferido em 03/11/2026 num Postgres descartável (PGlite), aplicado por cima do schema inteiro de antes.

-- CreateTable
CREATE TABLE "Ghotin2Conta" (
    "id" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "nomeVisivel" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "termosEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoAcesso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "falhasLogin" INTEGER NOT NULL DEFAULT 0,
    "travadoAte" TIMESTAMP(3),
    "tokenVersao" INTEGER NOT NULL DEFAULT 0,
    "resetHash" TEXT,
    "resetAte" TIMESTAMP(3),
    "sessao" TEXT,
    "sessaoDesde" TIMESTAMP(3),
    "banido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Ghotin2Conta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ghotin2Personagem" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "espaco" INTEGER,
    "nome" TEXT NOT NULL,
    "nomeChave" TEXT,
    "classe" TEXT NOT NULL,
    "vocacao" TEXT,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "exp" INTEGER NOT NULL DEFAULT 0,
    "mapa" TEXT,
    "dados" TEXT NOT NULL DEFAULT '',
    "tamanho" INTEGER NOT NULL DEFAULT 0,
    "versao" INTEGER NOT NULL DEFAULT 0,
    "suspeito" BOOLEAN NOT NULL DEFAULT false,
    "suspeitoMotivo" TEXT,
    "subiuEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "apagadoEm" TIMESTAMP(3),

    CONSTRAINT "Ghotin2Personagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ghotin2Comum" (
    "contaId" TEXT NOT NULL,
    "dados" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL DEFAULT 0,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ghotin2Comum_pkey" PRIMARY KEY ("contaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ghotin2Conta_usuario_key" ON "Ghotin2Conta"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Ghotin2Conta_resetHash_key" ON "Ghotin2Conta"("resetHash");

-- CreateIndex
CREATE UNIQUE INDEX "Ghotin2Personagem_nomeChave_key" ON "Ghotin2Personagem"("nomeChave");

-- CreateIndex
CREATE INDEX "Ghotin2Personagem_nivel_exp_idx" ON "Ghotin2Personagem"("nivel", "exp");

-- CreateIndex
CREATE INDEX "Ghotin2Personagem_classe_nivel_exp_idx" ON "Ghotin2Personagem"("classe", "nivel", "exp");

-- CreateIndex
CREATE UNIQUE INDEX "Ghotin2Personagem_contaId_espaco_key" ON "Ghotin2Personagem"("contaId", "espaco");

-- AddForeignKey
ALTER TABLE "Ghotin2Personagem" ADD CONSTRAINT "Ghotin2Personagem_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Ghotin2Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ghotin2Comum" ADD CONSTRAINT "Ghotin2Comum_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Ghotin2Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

