-- ===== Família Santos (jogo em /jocelino/): save na conta — 14/10/2026 =====
-- Gerado com:
--   npx prisma migrate diff --from-schema-datamodel <schema.prisma de antes> \
--     --to-schema-datamodel prisma/schema.prisma --script
-- SÓ ACRESCENTA: uma tabela nova e a chave estrangeira DELA para "User" (apagar a conta apaga o save).
-- Não altera nem apaga nada que já existe.
--
-- Por que fica aqui e não em prisma/migrations/: aquela pasta está parada desde 08/2026 e travada em
-- "sqlite" (migration_lock.toml); o banco de produção (Neon) recebe o schema por "npx prisma db push",
-- rodado à mão. Este arquivo serve para conferir/aplicar à mão (psql ou o SQL Editor do Neon) se preferir
-- não usar o db push. Os dois dão o mesmo resultado.

-- CreateTable
CREATE TABLE "JocelinoSave" (
    "userId" TEXT NOT NULL,
    "dados" TEXT NOT NULL,
    "dia" INTEGER NOT NULL DEFAULT 1,
    "tamanho" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JocelinoSave_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "JocelinoSave" ADD CONSTRAINT "JocelinoSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
