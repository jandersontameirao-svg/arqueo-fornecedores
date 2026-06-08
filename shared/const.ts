export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
// TTL ativo de sessao. Antes era 1 ano: combinado com blocklist em memoria
// (que perde estado a cada restart PM2), um JWT roubado ficava valido por meses.
// 7 dias e um compromisso razoavel: usuario nao precisa relogar todo dia, mas
// roubo de cookie expira em ate uma semana.
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';
