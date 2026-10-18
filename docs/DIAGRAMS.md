# Diagrams Reference

The detailed diagrams live in `misc/diagramas-reviewit-updated.md`. This document provides a quick reference to what's covered.

## Contents from misc/diagramas-reviewit-updated.md

1. **DER (Diagrama de Entidade-Relacionamento)** — entities, relationships, constraints
2. **Arquitetura de Componentes** — layers and dependencies
3. **Sequência: Autenticação OAuth (Supabase)** — auth flow
4. **Sequência: Criar Post (com validação + RFC 7807)** — request flow with validation and error handling
5. **Estados**
   - Ciclo de vida da Denúncia (`ReportStatus`)
   - Ciclo de vida da Conta do Usuário (`AccountStatus`)
6. **Diagrama de Classes: Arquitetura em Camadas (Domínio Post)** — Post domain class structure
7. **Diagrama de Classes: Entidades JPA e Enums com Converters** — JPA entities and enum converters

## Viewing locally

```bash
# Render markdown with diagrams if using markdown viewers that support Mermaid
cat misc/diagramas-reviewit-updated.md
```

The original source is preserved in `misc/` (gitignored). This file serves as an index.