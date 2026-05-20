import { describe, it } from "vitest";

describe("Inspect actual procedure names", () => {
  it("list all procedures", async () => {
    const { appRouter } = await import("./routers");
    const procs = Object.keys(appRouter._def.procedures).sort();
    const check = [
      "complianceAudit.list",
      "templates.list",
      "templates.getById",
    ];
    check.forEach((p) => {
      const exists = procs.includes(p);
      if (!exists) {
        const base = p.split(".")[0];
        const similar = procs.filter((x) => x.startsWith(base)).slice(0, 10);
        console.log(`MISSING: ${p} | Similar: ${similar.join(", ")}`);
      } else {
        console.log(`EXISTS: ${p}`);
      }
    });
    // Also print all templates.* and complianceAudit.*
    console.log("All templates.*:", procs.filter(p => p.startsWith("templates")).join(", "));
    console.log("All complianceAudit.*:", procs.filter(p => p.startsWith("complianceAudit")).join(", "));
  });
});
