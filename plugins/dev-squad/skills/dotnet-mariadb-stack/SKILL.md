---
name: dotnet-mariadb-stack
description: Backend stack reference for the dev-squad backend agents - .NET (latest LTS, currently 10), ASP.NET Core layered modular monolith, EF Core with Oracle MySql.EntityFrameworkCore on MariaDB, ASP.NET Core Identity + JWT, FluentValidation, xUnit/NSubstitute/FluentAssertions. Load before planning, implementing, reviewing or testing backend work. ProjectInfo/ overrides anything here.
---

# Backend stack: .NET + MariaDB

Defaults derived from a reference project (TradesApp). **If `ProjectInfo/conventions-backend.md` or `architecture.md` says otherwise, the project wins.** Detect real versions and commands yourself before relying on anything below: target framework and package versions from the `.csproj` files, the solution file for `dotnet build`/`dotnet test`, `launchSettings.json` for the run URL. No conventions file is required.

## Stack
- **.NET latest LTS** (currently .NET 10; an existing project keeps the target framework in its csproj - never upgrade or downgrade it without a task), ASP.NET Core controllers (`[ApiController]`), `Nullable` and `ImplicitUsings` enabled.
- **EF Core** (latest major matching the .NET LTS, e.g. EF Core 10 on .NET 10) with Oracle's **`MySql.EntityFrameworkCore`** (10.0.x for EF Core 10) against **MariaDB** (11.x). Registration is `options.UseMySQL(connectionString)` (capital `SQL`; no `ServerVersion` argument, unlike Pomelo's `UseMySql`). The provider officially targets MySQL, so **MariaDB compatibility must be verified, not assumed**: apply each migration to a scratch MariaDB database and exercise the feature (JSON columns, collations, GUID keys, concurrency tokens, date/time precision) before relying on it, and report any provider limitation to the senior. Keep all provider-specific code (`UseMySQL`, provider-specific column types) inside Infrastructure so the provider can be swapped (`Microting.EntityFrameworkCore.MySql` or `Pomelo.EntityFrameworkCore.MySql`, which use `UseMySql`) without touching other layers. An existing project already on another provider keeps it unless a task migrates it. Keep every `Microsoft.EntityFrameworkCore*` package on one major supported by the provider, pin exact versions (no wildcards), and check NuGet for the newest stable before choosing. A provider/EF major mismatch is a finding, not something to fix silently.
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

## API contract (OpenAPI is the source of truth)
- The API publishes an **OpenAPI document generated at build time** and committed to the repo at `contracts/openapi.json` (repository root, shared by both sides). Use the built-in `Microsoft.AspNetCore.OpenApi` (`AddOpenApi()` / `MapOpenApi()`) plus build-time generation (`Microsoft.Extensions.ApiDescription.Server` with `OpenApiGenerateDocuments` and `OpenApiDocumentsDirectory` pointing at `contracts/`), following the docs for the installed .NET version. Keep Swashbuckle only if the project already uses it.
- Setting this up is a **pattern-setting** task (backend senior). After that, every backend task that changes an endpoint must leave `contracts/openapi.json` regenerated by the build and committed with the change.
- Describe responses precisely so the generated contract is useful: `[ProducesResponseType]` for every status (with the DTO type), `[Required]`/nullability matching reality, enums serialized as strings if the project does, XML/summary comments for operations.
- The task's `Contract` section names the operations it adds or changes; the spec must match it. A spec change that the task did not describe is a review finding.

## EF Core + MariaDB specifics
- Configure each entity in its own `IEntityTypeConfiguration<T>`; set `HasMaxLength` on every string (MariaDB index key limits and `longtext` defaults), explicit `HasPrecision` on decimals, enums stored consistently (string or int, as the project does), GUID keys per project convention.
- Index foreign keys and columns used in filters/sorting; unique indexes for natural keys (watch utf8mb4 index-length limits).
- Use `AsNoTracking()` for reads, project to DTOs with `Select`, avoid N+1 (`Include` or projection), paginate lists.
- Case-insensitive default collation: do not assume case-sensitive comparisons.
- Dates are UTC; be explicit about `DateTime` kind.
- Concurrency: use a concurrency token/row version where two actors can change the same row (status transitions, quotes, bookings).
- **Migrations:** `dotnet ef migrations add <Name>` (a design-time `IDesignTimeDbContextFactory` supplies the connection string); review the generated SQL/snapshot; never edit applied migrations; never run `database update`/`drop` against shared or developer databases without the user's approval (the QA scratch database below is the exception). A task that changes the model must include its migration.
- Connection string `DefaultConnection`; secrets (`Jwt:Secret`, connection strings, API keys) come from environment/user-secrets in real environments, never from committed files.

## QA test database (scratch, per task)
QA verifies migrations and data behaviour on a **brand-new database it creates and drops itself**, never on the developer's or any shared database.
- **Server and login (always):** `localhost`, port 3306, user `localhost`, password `localhost`. That user is granted rights only on databases matching `%_qa_%`, so it cannot touch anything else.
- **Name:** `<project>_qa_<taskid>` in lowercase, e.g. `demoapp_qa_t003`. Must contain `_qa_`.
- **Connection string:** `Server=localhost;Port=3306;Database=<name>;User ID=localhost;Password=localhost;`
- **Create + migrate:** run `dotnet ef database update --connection "<connection string>"` from the backend folder, with `--project`/`--startup-project` as the solution needs. EF creates the database if it does not exist and applies every migration from zero, which also proves the migrations work on a clean MariaDB.
- **Run the API against it:** set the environment variable `ConnectionStrings__DefaultConnection` to that connection string for the `dotnet run` process (never edit `appsettings*.json`).
- **Integration tests**, if the project has them, use the same connection string via the same variable.
- **Clean up** when QA finishes (pass or fail): `DROP DATABASE IF EXISTS <name>;` with the MariaDB client (`mariadb` on PATH, or `C:/Program Files/MariaDB */bin/mariadb.exe`) using `-hlocalhost -ulocalhost -plocalhost`. Only ever drop names containing `_qa_`.
- If the login fails, report `BLOCKED` with the error and the setup SQL from the plugin README; do not try other credentials.
- Developers and seniors who need a real database for a task use the same convention (a `_qa_` name, created and dropped the same way).

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
- `contracts/openapi.json` regenerated, committed, and matching the task's `Contract` (no undeclared endpoint or shape changes).
