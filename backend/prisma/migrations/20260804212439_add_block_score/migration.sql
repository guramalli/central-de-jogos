-- CreateTable
CREATE TABLE "BlockScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gameKey" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BlockScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockScore_userId_gameKey_roomId_key" ON "BlockScore"("userId", "gameKey", "roomId");
