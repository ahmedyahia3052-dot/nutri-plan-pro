import { useState, FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Register() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(t("auth.register.passwordMismatch"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.register.passwordTooShort"));
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("auth.register.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-0.5 bg-card rounded-lg p-1 border border-border shadow-sm">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t("app.name")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("app.tagline")}</p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-6">{t("auth.register.title")}</h2>

          {error && (
            <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">{t("auth.register.fullName")}</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="mt-1.5"
                placeholder={t("auth.register.namePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="reg-email">{t("auth.register.email")}</Label>
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="mt-1.5"
                placeholder={t("auth.login.emailPlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="reg-password">{t("auth.register.password")}</Label>
              <Input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1.5"
                placeholder={t("auth.register.passwordPlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="confirm">{t("auth.register.confirmPassword")}</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className="mt-1.5"
                placeholder={t("auth.register.confirmPlaceholder")}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 mt-2">
              {loading ? t("auth.register.submitting") : t("auth.register.submit")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("auth.register.hasAccount")}{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              {t("auth.register.signIn")}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 px-4">
          {t("common.educational")}
        </p>
      </div>
    </div>
  );
}
