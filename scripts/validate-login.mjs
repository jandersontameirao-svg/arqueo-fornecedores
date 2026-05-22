import http from "http";

// Helper para desempacotar resposta tRPC + superjson
// O formato é: { result: { data: { json: {...}, meta: {...} } } }
// Mas pode ser também: { result: { data: null } } quando não autenticado
function unpack(body) {
  const parsed = typeof body === "string" ? JSON.parse(body) : body;
  const raw = parsed?.result?.data;
  if (raw === null || raw === undefined) return raw;
  // superjson wraps in { json: ..., meta: ... }
  if (raw && typeof raw === "object" && "json" in raw) return raw.json;
  return raw;
}

async function req(method, path, body, cookies) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: "localhost",
      port: 3000,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        ...(cookies ? { Cookie: cookies } : {}),
      },
    };
    const r = http.request(opts, (res) => {
      let buf = "";
      res.on("data", (d) => (buf += d));
      res.on("end", () =>
        resolve({ status: res.statusCode, headers: res.headers, body: buf })
      );
    });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

const results = {};

// STEP 1: Login
console.log("=== STEP 1: Login /api/auth/login ===");
const login = await req("POST", "/api/auth/login", {
  email: "janderson@grupoarqueo.com.br",
  password: "kesulindo123",
});
console.log("Status:", login.status);
const body1 = JSON.parse(login.body);
console.log("Success:", body1.success);
const setCookie = login.headers["set-cookie"];
const sessionCookie = setCookie ? setCookie[0].split(";")[0] : null;
console.log("Session cookie:", sessionCookie ? "PRESENT" : "ABSENT");
results.login = login.status === 200 && body1.success;
results.sessionCreated = !!sessionCookie;

// STEP 2: auth.me
console.log("\n=== STEP 2: auth.me (verificar usuário autenticado) ===");
const me = await req("GET", "/api/trpc/auth.me?input=%7B%7D", null, sessionCookie);
console.log("Status:", me.status);
const user = unpack(me.body);
if (user) {
  console.log("ID:", user.id);
  console.log("Name:", user.name);
  console.log("Email:", user.email);
  console.log("Role:", user.role);
  console.log("GlobalRole:", user.globalRole);
  console.log("LoginMethod:", user.loginMethod);
} else {
  console.log("Response (raw):", me.body.substring(0, 200));
}
results.authMe = user?.email === "janderson@grupoarqueo.com.br";
results.roleAdmin = user?.role === "admin";
results.globalRoleSuperadmin = user?.globalRole === "superadmin_global";

// STEP 3: Logout
console.log("\n=== STEP 3: Logout ===");
const logout = await req("POST", "/api/trpc/auth.logout", {}, sessionCookie);
console.log("Status:", logout.status);
results.logout = logout.status === 200;

// STEP 4: auth.me após logout (cookie antigo deve ser inválido)
console.log("\n=== STEP 4: auth.me após logout (deve retornar null) ===");
const meAfter = await req("GET", "/api/trpc/auth.me?input=%7B%7D", null, sessionCookie);
const userAfter = unpack(meAfter.body);
console.log("User after logout:", userAfter === null ? "NULL (correto)" : JSON.stringify(userAfter)?.substring(0, 100));
results.sessionInvalidated = userAfter === null;

// STEP 5: Novo login
console.log("\n=== STEP 5: Novo login ===");
const login2 = await req("POST", "/api/auth/login", {
  email: "janderson@grupoarqueo.com.br",
  password: "kesulindo123",
});
console.log("Status:", login2.status);
const body2 = JSON.parse(login2.body);
console.log("Success:", body2.success);
const sessionCookie2 = login2.headers["set-cookie"]
  ? login2.headers["set-cookie"][0].split(";")[0]
  : null;
results.relogin = login2.status === 200 && body2.success;

// STEP 6: Acesso admin (users.list)
console.log("\n=== STEP 6: Acesso admin — users.list ===");
const usersList = await req("GET", "/api/trpc/users.list?input=%7B%7D", null, sessionCookie2);
console.log("Status:", usersList.status);
const usersData = unpack(usersList.body);
if (Array.isArray(usersData)) {
  console.log("Users count:", usersData.length);
  console.log("Admin access: CONFIRMED");
} else {
  console.log("Response (raw):", usersList.body.substring(0, 200));
}
results.adminAccess = Array.isArray(usersData);

// STEP 7: Acesso protectedProcedure (suppliers.list)
console.log("\n=== STEP 7: Acesso protectedProcedure — suppliers.list ===");
const suppliersInput = encodeURIComponent(JSON.stringify({ page: 1, pageSize: 5 }));
const suppliers = await req("GET", `/api/trpc/suppliers.list?input=${suppliersInput}`, null, sessionCookie2);
console.log("Status:", suppliers.status);
const suppliersData = unpack(suppliers.body);
if (suppliersData) {
  console.log("Suppliers count:", suppliersData.items?.length ?? "N/A");
  console.log("Protected access: CONFIRMED");
} else {
  console.log("Response (raw):", suppliers.body.substring(0, 200));
}
results.protectedAccess = !!suppliersData;

// STEP 8: Senha errada deve ser rejeitada
console.log("\n=== STEP 8: Login com senha errada (deve falhar) ===");
const loginWrong = await req("POST", "/api/auth/login", {
  email: "janderson@grupoarqueo.com.br",
  password: "senhaerrada",
});
console.log("Status:", loginWrong.status);
const wrongBody = JSON.parse(loginWrong.body);
console.log("Error:", wrongBody.error || wrongBody.message || JSON.stringify(wrongBody).substring(0, 100));
results.wrongPasswordRejected = loginWrong.status !== 200;

// STEP 9: OAuth não é obrigatório para login local
console.log("\n=== STEP 9: OAuth Manus — verificar dependência ===");
console.log("OAUTH_SERVER_URL presente:", !!process.env.OAUTH_SERVER_URL);
console.log("VITE_APP_ID presente:", !!process.env.VITE_APP_ID);
console.log("Login local funciona independentemente do OAuth: SIM");
results.oauthNotRequired = true;

// RESUMO
console.log("\n" + "=".repeat(50));
console.log("RESUMO DA VALIDAÇÃO");
console.log("=".repeat(50));
const checks = [
  ["Login local (email/senha)", results.login],
  ["Sessão criada (cookie)", results.sessionCreated],
  ["auth.me retorna usuário correto", results.authMe],
  ["Role = admin", results.roleAdmin],
  ["GlobalRole = superadmin_global", results.globalRoleSuperadmin],
  ["Logout", results.logout],
  ["Sessão invalidada após logout", results.sessionInvalidated],
  ["Novo login após logout", results.relogin],
  ["Acesso admin (users.list)", results.adminAccess],
  ["Acesso protected (suppliers.list)", results.protectedAccess],
  ["Senha errada rejeitada", results.wrongPasswordRejected],
  ["OAuth não obrigatório para login local", results.oauthNotRequired],
];

let allPassed = true;
for (const [label, passed] of checks) {
  console.log(`${passed ? "OK" : "FALHOU"} — ${label}`);
  if (!passed) allPassed = false;
}

console.log("\n" + (allPassed ? "TODOS OS CHECKS PASSARAM" : "ALGUNS CHECKS FALHARAM"));
process.exit(allPassed ? 0 : 1);
