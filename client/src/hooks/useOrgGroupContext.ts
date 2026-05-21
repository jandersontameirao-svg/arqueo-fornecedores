/**
 * Hook useOrgGroupContext — separado do OrgGroupContext.tsx para compatibilidade
 * com Vite Fast Refresh (React 19). Arquivos que exportam tanto componentes quanto
 * hooks quebram o HMR; por isso o hook foi movido para este arquivo dedicado.
 */
export { useOrgGroupContext } from "@/contexts/OrgGroupContext";
