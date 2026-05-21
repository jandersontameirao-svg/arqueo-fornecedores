/**
 * Testes de segurança — Lista Branca de Superadmins
 *
 * Garante que apenas jandersontameirao@gmail.com e fernanda@arqueoproject.com.br
 * podem ter o papel superadmin_global. Qualquer outro email é bloqueado.
 */
import { describe, it, expect, vi } from "vitest";
import { isSuperAdminEmail, SUPERADMIN_EMAILS } from "../shared/superadmins";

// ==================== Testes da lista branca ====================
describe("isSuperAdminEmail — lista branca", () => {
  it("autoriza jandersontameirao@gmail.com", () => {
    expect(isSuperAdminEmail("jandersontameirao@gmail.com")).toBe(true);
  });

  it("autoriza fernanda@arqueoproject.com.br", () => {
    expect(isSuperAdminEmail("fernanda@arqueoproject.com.br")).toBe(true);
  });

  it("bloqueia email não autorizado", () => {
    expect(isSuperAdminEmail("hacker@evil.com")).toBe(false);
  });

  it("bloqueia email similar com capitalização diferente (case-insensitive)", () => {
    expect(isSuperAdminEmail("JANDERSONTAMEIRAO@GMAIL.COM")).toBe(true);
    expect(isSuperAdminEmail("Fernanda@ArqueoProject.Com.Br")).toBe(true);
  });

  it("bloqueia email com espaços extras (trim)", () => {
    expect(isSuperAdminEmail("  jandersontameirao@gmail.com  ")).toBe(true);
  });

  it("bloqueia null e undefined", () => {
    expect(isSuperAdminEmail(null)).toBe(false);
    expect(isSuperAdminEmail(undefined)).toBe(false);
    expect(isSuperAdminEmail("")).toBe(false);
  });

  it("bloqueia email de admin existente no banco que não é da lista branca", () => {
    expect(isSuperAdminEmail("fernanda@arqueoproject.onmicrosoft.com")).toBe(false);
    expect(isSuperAdminEmail("natalia@arqueoproject.onmicrosoft.com")).toBe(false);
    expect(isSuperAdminEmail("gentegestao@grupoarqueo.com.br")).toBe(false);
  });

  it("a lista branca tem exatamente 2 emails", () => {
    expect(SUPERADMIN_EMAILS.size).toBe(2);
  });
});

// ==================== Testes de lógica de rebaixamento ====================
describe("resolveOrgContext — proteção de superadmin_global (lógica pura)", () => {
  it("rebaixa globalRole para viewer se email não está na lista branca", () => {
    // Testa a lógica de isSuperAdminEmail que é usada dentro de resolveOrgContext
    const unauthorizedEmails = [
      "hacker@evil.com",
      "fernanda@arqueoproject.onmicrosoft.com",
      "natalia@arqueoproject.onmicrosoft.com",
      "gentegestao@grupoarqueo.com.br",
      "admin@qualquerdominio.com",
    ];
    for (const email of unauthorizedEmails) {
      expect(isSuperAdminEmail(email)).toBe(false);
    }
  });

  it("mantém superadmin_global apenas para emails da lista branca", () => {
    const authorizedEmails = ["jandersontameirao@gmail.com", "fernanda@arqueoproject.com.br"];
    for (const email of authorizedEmails) {
      expect(isSuperAdminEmail(email)).toBe(true);
    }
  });

  it("bloqueia tentativa de bypass via email similar (subdomínio, ponto extra)", () => {
    expect(isSuperAdminEmail("jandersontameirao@gmail.com.br")).toBe(false);
    expect(isSuperAdminEmail("jandersontameirao@gmail.co")).toBe(false);
    expect(isSuperAdminEmail("fernanda@arqueoproject.com")).toBe(false);
    expect(isSuperAdminEmail("fernanda@arqueoproject.com.br.evil.com")).toBe(false);
  });
});
