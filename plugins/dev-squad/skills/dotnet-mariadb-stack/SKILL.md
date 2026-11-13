---
name: dotnet-mariadb-stack
description: Backend stack reference for the dev-squad backend agents - .NET (latest LTS, currently 10), ASP.NET Core layered modular monolith, EF Core with Pomelo on MariaDB, ASP.NET Core Identity + JWT, FluentValidation, xUnit/NSubstitute/FluentAssertions. Load before planning, implementing, reviewing or testing backend work. ProjectInfo/ overrides anything here.
---

# Backend stack: .NET + MariaDB

Defaults derived from a reference project (TradesApp). **If `ProjectInfo/conventions-backend.md` or `architecture.md` says otherwise, the project wins.** Detect real versions from the `.csproj` files before relying on anything below.

## Stack
- **.NET latest LTS** (currently .NET 10; an existing project keeps the target framework in its csproj - never upgrade or downgrade it without a task), ASP.NET Core controllers (`[ApiController]`), `Nullable` and `ImplicitUsings` enabled.
- **EF Core** with **Pomelo.EntityFrameworkCore.MySql** against **MariaDB** (11.x). Pomelo lags new EF Core majors (e.g. Pomelo 9.x supports EF Core 9.x even on .NET 10): choose the EF Core major that the latest stable Pomelo supports, keep `Microsoft.EntityFrameworkCore*` packages on that same major, and check NuGet before bumping either. A mismatch is a finding, not something to fix silently.
- **ASP.NET Core Identity** (`UserManager`) for users, password hashing, lockout, email-confirmation and reset tokens. JWT issuance and policy/role authorization sit on top of it. Never hand-roll hashing, credential storage or those tokens.
- **FluentValidation** for all validation. Swashbuckle for OpenAPI, Serilog for logging.
- **Tests:** xUnit + NSubstitute + FluentAssertions.
- No Dapper, no raw ADO.NET, no CQRS/MediatR unless the project explicitly says so.

## Architecture: layered modular monolith
Dependency direction is a straight line: `API -> Application -> Infrastructure -> Domain`.

| Layer | Contains | Must not contain |
|---|---|---|
| Domain | Entities, enums, DTOs, viewmodels, request/response models (`Domain/<Feature>/Dtos`, `Requests`), shared abstractions (`ICurrentUserContext`) | Business logic, EF Core, validation |
| Infrastructure | `AppDbContext`, `IEntityTypeConfiguration<>` classes, migrations, seeders, `I*Repository` + implementations, file storage | Business rules, validation, email/SMTP |
| Application | Use-case services (`I<Feature>Service` / `<Feature>Service`), FluentValidation validators (`Application/<Feature>/Validators`), orchestration; consumes repositories | Controllers, HTTP concerns, SMTP |
| API | Controllers, auth/JWT plumbing, middleware, hosted adapters (email), DI composition root (`Program.cs`) | Business logic, data access |

Where new code goes: DB query/command -> repository in Infrastructure; business rule/validation -> Application; new shape -> Domain; non-DB adapter (email, SMS) -> interface in Application, implementation in API.

## Conventions to mirror
- **Controllers** are thin: route `api/v1/...`, `[Authorize(Policy = ...)]` or explicit `[AllowAnonymous]`, `[ProducesResponseType]` for every status, `CancellationToken` on every action, return the service result.
- **Services** are `sealed`, use constructor injection, take `IValidator<TRequest>` per request type, read the caller from `ICurrentUserContext`, and throw the project's domain exceptions mapped by the exception-handling middleware (404/403/409/422).
- **Repositories**: one interface + implementation per aggregate, async with `CancellationToken`, in one repositories namespace.
- **Responses:** DTOs only; never return entities. JSON camelCase.
- **Ownership/tenant isolation:** every query for user-owned data filters by the current user; a wrong owner returns 404/403 as the project defines. Test it.
- Validation errors are 422 with field messages; anti-enumeration responses on auth flows; rate limiting on auth endpoints.

## EF Core + MariaDB specifics
- Configure each entity in its own `IEntityTypeConfiguration<T>`; set `HasMaxLength` on every string (MariaDB index key limits and `longtext` defaults), explicit `HasPrecision` on decimals, enums stored consistently (string or int, as the project does), GUID keys per project convention.
- Index foreign keys and columns used in filters/sorting; unique indexes for natural keys (watch utf8mb4 index-length limits).
- Use `AsNoTracking()` for reads, project to DTOs with `Select`, avoid N+1 (`Include` or projection), paginate lists.
- Case-insensitive default collation: do not assume case-sensitive comparisons.
- Dates are UTC; be explicit about `DateTime` kind.
- Concurrency: use a concurrency token/row version where two actors can change the same row (status transitions, quotes, bookings).
- **Migrations:** `dotnet ef migrations add <Name>` (design-time factory pins the MariaDB server version); review the generated SQL/snapshot; never edit applied migrations; never run `database update`/`drop` against shared databases without the user's approval. A task that changes the model must include its migration.
- Connection string `DefaultConnection`; secrets (`Jwt:Secret`, connection strings, API keys) come from environment/user-secrets in real environments, never from committed files.

## Testing rules
- xUnit, NSubstitute for repositories/services, FluentAssertions; `async Task`, never `async void`.
- Per behaviour: success, each validation failure, edge cases, ownership/role refusal, and that important dependencies were called (`Received(1)`) or not called (`DidNotReceive`).
- No placeholder tests or "add more later" comments.
- Commands: `dotnet build`, `dotnet test` (run from the backend folder / solution given in `ProjectInfo`).

## Review/QA checklist (security and correctness)
- Authorization attribute present and the right policy; ownership enforced in the service, not only in the controller.
- No entities exposed; no mass assignment (request models carry only allowed fields).
- Inputs validated; no string-concatenated SQL (`FromSqlRaw` only with parameters).
- Totals, prices and status transitions computed/validated server-side.
- No secrets, stack traces or PII in responses or logs.
- Migration present, reversible, and matching the model snapshot.
