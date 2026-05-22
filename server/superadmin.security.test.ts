/**
 * Testes de segurança — Lista Branca de Superadmins
 *
 * Emails autorizados como superadmin_global:
 *   - janderson@grupoarqueo.com.br (CEO Grupo Arqueo)
 *   - financeiro@grupoarqueo.com.br (Financeiro Grupo Arqueo)
 *   - fernanda@arqueoproject.com.br
 *
 * Qualquer outro email é bloqueado.
 */
import { describe, it, expect } from "vitest";
import { isSuperAdminEmail, SUPERADMIN_EMAILS } from "../shared/superadmins";

// ==================== Testes da lista branca ====================
describe("isSuperAdminEmail — lista branca", () => {
  it("autoriza janderson@grupoarqueo.com.br", () => {
    expect(isSuperAdminEmail("janderson@grupoarqueo.com.br")).toBe(true);
  });

  it("autoriza financeiro@grupoarqueo.com.br", () => {
    expect(isSuperAdminEmail("financeiro@grupoarqueo.com.br")).toBe(true);
  });

  it("autoriza fernanda@arqueoproject.com.br", () => {
    expect(isSuperAdminEmail("fernanda@arqueoproject.com.br")).toBe(true);
  });

  it("bloqueia email não autorizado", () => {
    expect(isSuperAdminEmail("hacker@evil.com")).toBe(false);
  });

  it("bloqueia email antigo do Janderson (substituído)", () => {
    expect(isSuperAdminEmail("jandersontameirao@gmail.com")).toBe(false);
  });

  it("comparação case-insensitive (não permite bypass por capitalização)", () => {
    expect(isSuperAdminEmail("JANDERSON@GRUPOARQUEO.COM.BR")).toBe(true);
    expect(isSuperAdminEmail("Financeiro@GrupoArqueo.Com.Br")).toBe(true);
    expect(isSuperAdminEmail("Fernanda@ArqueoProject.Com.Br")).toBe(true);
  });

  it("trim de espaços extras", () => {
    expect(isSuperAdminEmail("  janderson@grupoarqueo.com.br  ")).toBe(true);
  });

  it("bloqueia null, undefined e string vazia", () => {
    expect(isSuperAdminEmail(null)).toBe(false);
    expect(isSuperAdminEmail(undefined)).toBe(false);
    expect(isSuperAdminEmail("")).toBe(false);
  });

  it("bloqueia emails de admin existentes no banco que não são da lista branca", () => {
    expect(isSuperAdminEmail("fernanda@arqueoproject.onmicrosoft.com")).toBe(false);
    expect(isSuperAdminEmail("natalia@arqueoproject.onmicrosoft.com")).toBe(false);
    expect(isSuperAdminEmail("gentegestao@grupoarqueo.com.br")).toBe(false);
  });

  it("a lista branca tem exatamente 3 emails", () => {
    expect(SUPERADMIN_EMAILS.size).toBe(3);
  });
});

// ==================== Testes de lógica de rebaixamento ====================
describe("resolveOrgContext — proteção de superadmin_global (lógica pura)", () => {
  it("rebaixa globalRole para viewer se email não está na lista branca", () => {
    const unauthorizedEmails = [
      "hacker@evil.com",
      "jandersontameirao@gmail.com",
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
    const authorizedEmails = [
      "janderson@grupoarqueo.com.br",
      "financeiro@grupoarqueo.com.br",
      "fernanda@arqueoproject.com.br",
    ];
    for (const email of authorizedEmails) {
      expect(isSuperAdminEmail(email)).toBe(true);
    }
  });

  it("bloqueia tentativa de bypass via email similar (subdomínio, ponto extra)", () => {
    expect(isSuperAdminEmail("janderson@grupoarqueo.com.br.evil.com")).toBe(false);
    expect(isSuperAdminEmail("janderson@grupoarqueo.com")).toBe(false);
    expect(isSuperAdminEmail("financeiro@grupoarqueo.com")).toBe(false);
    expect(isSuperAdminEmail("fernanda@arqueoproject.com")).toBe(false);
    expect(isSuperAdminEmail("fernanda@arqueoproject.com.br.evil.com")).toBe(false);
  });
});
