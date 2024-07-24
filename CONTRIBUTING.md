# Contributing

## Branch naming

- `feat/<scope>-<short-description>`
- `fix/<scope>-<short-description>`
- `chore/<scope>-<short-description>`

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`, `build`.

## Pull request checklist

- [ ] `pnpm lint` passes locally
- [ ] `pnpm typecheck` passes
- [ ] Tests added or updated for behavior changes
- [ ] README or runbook updated when setup or env vars change
- [ ] No secrets or `.env` files committed

## Local setup

See [README.md](./README.md) for workspace install and service startup.
