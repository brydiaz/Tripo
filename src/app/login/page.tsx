"use client";

import { useState } from "react";
import { signIn, signUp } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    setMessage("");

    if (!email || !password) {
      setMessage("Completa correo y contraseña.");
      return;
    }

    const result =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    setMessage(
      mode === "signup"
        ? "Cuenta creada. Revisa tu correo si Supabase pide confirmación."
        : "Sesión iniciada correctamente."
    );

    if (mode === "login") {
      router.push("/");
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F14] px-5 py-8 text-white">
      <div className="mx-auto flex max-w-md flex-col gap-4 rounded-[28px] border border-white/10 bg-[#141a22] p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">
            Tripo Auth
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#2D9CDB]">
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Guarda tus rutas en la nube y accede desde cualquier dispositivo.
          </p>
        </div>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
        />

        <button
          onClick={handleSubmit}
          className="rounded-2xl bg-[#2D9CDB] px-4 py-3 font-semibold text-white"
        >
          {mode === "login" ? "Entrar" : "Crear cuenta"}
        </button>

        <button
          onClick={() =>
            setMode((prev) => (prev === "login" ? "signup" : "login"))
          }
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
        >
          {mode === "login"
            ? "No tengo cuenta"
            : "Ya tengo cuenta"}
        </button>

        {message && (
          <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/75">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}