-- Asegurar que solo haya una fila de puntos por usuario
ALTER TABLE "pints_user"
  ADD CONSTRAINT "pints_user_user_unique" UNIQUE ("IdUser");
