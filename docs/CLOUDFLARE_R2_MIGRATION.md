# Migração de Storage: Manus Forge S3 → Cloudflare R2

## Contexto
O projeto **Arqueo Fornecedores** atualmente usa o S3 proxy da Manus Forge para upload/download de documentos, contratos e arquivos. Para hospedar o sistema em servidor externo (Hostinger, AWS, etc.), é necessário substituir essa dependência por um serviço de storage independente.

**Escolha: Cloudflare R2**
- Gratuito até 10GB/mês
- Zero taxa de saída de dados
- API 100% compatível com S3
- Sem cartão de crédito para plano gratuito

---

## Passo 1: Criar Conta e Credenciais no Cloudflare R2

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Faça login ou crie uma conta
3. No menu lateral, vá para **R2** (Object Storage)
4. Clique em **Create bucket**
5. Nome do bucket: `arqueo-fornecedores` (ou qualquer nome único)
6. Escolha região mais próxima (ex: São Paulo se disponível, senão US)
7. Clique em **Create bucket**

### Gerar Credenciais de API
1. No menu lateral do R2, clique em **API Tokens**
2. Clique em **Create API Token**
3. Escolha **Edit** (permissão de leitura e escrita)
4. Em **Bucket access**, selecione **Specific bucket** → escolha o bucket criado
5. Clique em **Create API Token**
6. **Copie e guarde em local seguro:**
   - `Access Key ID`
   - `Secret Access Key`
7. Anote também o **Account ID** (visível no topo do painel R2)

---

## Passo 2: Variáveis de Ambiente

Após exportar o código para GitHub/Hostinger, configure estas variáveis de ambiente no servidor:

```bash
# Cloudflare R2
R2_ACCOUNT_ID=seu_account_id_aqui
R2_ACCESS_KEY_ID=sua_access_key_aqui
R2_SECRET_ACCESS_KEY=sua_secret_key_aqui
R2_BUCKET_NAME=arqueo-fornecedores
R2_REGION=auto  # ou us-east-1, sa-east-1, etc
```

**Onde configurar no Hostinger:**
- Se usar Node.js com PM2: arquivo `.env` na raiz do projeto
- Se usar cPanel: variáveis de ambiente na seção "Node.js"
- Se usar Docker: arquivo `.env` ou variáveis no `docker-compose.yml`

---

## Passo 3: Modificações no Código

### Arquivo: `server/_core/env.ts`

**Adicionar estas linhas:**

```typescript
export const ENV = {
  // ... variáveis existentes ...
  
  // Cloudflare R2
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2BucketName: process.env.R2_BUCKET_NAME ?? "arqueo-fornecedores",
  r2Region: process.env.R2_REGION ?? "auto",
};
```

### Arquivo: `server/storage.ts`

**Substituir completamente por:**

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from './_core/env';

// Inicializar cliente S3 compatível com R2
const s3Client = new S3Client({
  region: ENV.r2Region,
  credentials: {
    accessKeyId: ENV.r2AccessKeyId,
    secretAccessKey: ENV.r2SecretAccessKey,
  },
  endpoint: `https://${ENV.r2AccountId}.r2.cloudflarestorage.com`,
});

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  const buffer = typeof data === "string" 
    ? Buffer.from(data) 
    : Buffer.isBuffer(data) 
      ? data 
      : Buffer.from(data);

  const command = new PutObjectCommand({
    Bucket: ENV.r2BucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Gerar URL pública (R2 fornece URL pública por padrão)
  const url = `https://${ENV.r2AccountId}.r2.cloudflarestorage.com/${ENV.r2BucketName}/${key}`;
  
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  const command = new GetObjectCommand({
    Bucket: ENV.r2BucketName,
    Key: key,
  });

  // Gerar URL assinada com validade de 1 hora
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return { key, url };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}
```

### Instalar Dependência

No `package.json`, adicione:

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.400.0",
    "@aws-sdk/s3-request-presigner": "^3.400.0"
  }
}
```

Depois execute:

```bash
npm install
# ou
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## Passo 4: Remover Dependência da Manus Forge

### Arquivo: `server/_core/env.ts`

**Remover ou deixar vazias:**

```typescript
// Remover ou deixar como strings vazias (não serão mais usadas)
forgeApiUrl: "",
forgeApiKey: "",
```

### Arquivo: `server/storage.ts` (ANTES da migração)

**Remover import:**

```typescript
// REMOVER ESTA LINHA:
import { ENV } from './_core/env';
```

---

## Passo 5: Testes Locais (Antes de Deploy)

Após fazer as mudanças, teste localmente:

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo .env.local com credenciais de teste
echo "R2_ACCOUNT_ID=seu_account_id" > .env.local
echo "R2_ACCESS_KEY_ID=sua_access_key" >> .env.local
echo "R2_SECRET_ACCESS_KEY=sua_secret_key" >> .env.local
echo "R2_BUCKET_NAME=arqueo-fornecedores" >> .env.local

# 3. Rodar testes
npm run test

# 4. Iniciar servidor
npm run dev

# 5. Testar upload de arquivo via interface
# - Vá para a página de upload de documentos
# - Faça upload de um arquivo
# - Verifique se aparece no painel do Cloudflare R2
```

---

## Passo 6: Deploy no Hostinger

### Via cPanel (Node.js)

1. **SSH para o servidor Hostinger**
2. **Clone o repositório do GitHub**
3. **Configure variáveis de ambiente:**
   ```bash
   nano .env
   # Adicione as 4 variáveis R2_* acima
   ```
4. **Instale dependências:**
   ```bash
   npm install
   ```
5. **Inicie o servidor:**
   ```bash
   npm start
   # ou use PM2 para manter sempre rodando
   pm2 start "npm start" --name "arqueo"
   ```

### Via Docker (se Hostinger suportar)

Adicione ao `Dockerfile`:

```dockerfile
ENV R2_ACCOUNT_ID=${R2_ACCOUNT_ID}
ENV R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
ENV R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
ENV R2_BUCKET_NAME=arqueo-fornecedores
```

---

## Passo 7: Verificar Funcionamento

Após deploy:

1. **Acesse a aplicação no Hostinger**
2. **Tente fazer upload de um documento**
3. **Verifique se o arquivo aparece no painel do Cloudflare R2**
4. **Tente fazer download do arquivo**
5. **Confirme que a URL é do R2, não da Manus**

---

## Troubleshooting

### Erro: "Access Denied" ao fazer upload
- Verifique se `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY` estão corretos
- Confirme que o token de API tem permissão **Edit** no bucket específico

### Erro: "Bucket not found"
- Verifique se `R2_BUCKET_NAME` está correto (case-sensitive)
- Confirme que o bucket foi criado no Cloudflare R2

### URLs não funcionam
- Verifique se `R2_ACCOUNT_ID` está correto
- Confirme que o bucket tem acesso público habilitado (se necessário)

### Arquivo não persiste após upload
- Verifique logs do servidor: `npm logs` ou `pm2 logs`
- Confirme que credenciais R2 estão sendo carregadas do `.env`

---

## Resumo das Mudanças

| Componente | Antes (Manus Forge) | Depois (Cloudflare R2) |
|---|---|---|
| **Endpoint** | `https://forge.manus.im/v1/storage/upload` | `https://{accountId}.r2.cloudflarestorage.com` |
| **Autenticação** | Bearer token Manus | AWS SDK v3 (Access Key + Secret) |
| **Custo** | Incluído no plano Manus | Gratuito até 10GB/mês |
| **Portabilidade** | Dependente da Manus | 100% independente |
| **Código** | `server/storage.ts` (~50 linhas) | `server/storage.ts` (~80 linhas) |

---

## Próximas Etapas

1. ✅ Criar conta Cloudflare R2
2. ✅ Gerar credenciais de API
3. ✅ Atualizar `env.ts` com variáveis R2
4. ✅ Reescrever `storage.ts` com SDK AWS
5. ✅ Instalar `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner`
6. ✅ Testar localmente
7. ✅ Exportar para GitHub
8. ✅ Deploy no Hostinger
9. ✅ Verificar funcionamento

---

## Documentação Oficial

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/)
- [S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/compatibility/)
