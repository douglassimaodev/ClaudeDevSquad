# Backend conventions (.NET)

- **Stack (defaults, see skill `dev-squad:dotnet-mariadb-stack`):** .NET latest LTS (currently 10), ASP.NET Core, EF Core + Pomelo on MariaDB, Identity + JWT, FluentValidation, xUnit/NSubstitute/FluentAssertions. Override here if different.
- **Versions:** <exact .NET, EF Core, Pomelo, MariaDB versions>
- **Structure & naming:** <controller/endpoint style, use cases/handlers, DTOs, validators>
- **Error handling & responses:** <ProblemDetails, error codes>
- **Security:** <auth scheme, roles/policies, ownership checks, secrets handling>
- **Tests:** <framework, where they live, what is required per endpoint>
- **Commands**
  - Build: `dotnet build`
  - Test: `dotnet test`
  - Run API locally: <command + URL>
  - Migrations: <command; never apply to shared DBs without asking>
