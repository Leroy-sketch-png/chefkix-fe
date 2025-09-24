# Contributing to Chefkix-FE

First off, thank you for considering contributing to this project! Your help is greatly appreciated.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please ensure the bug was not already reported by searching the project's issue tracker. If you're unable to find an open issue addressing the problem, open a new one.

### Suggesting Enhancements

If you have an idea for an enhancement, please open an issue to discuss it. This allows us to coordinate our efforts and prevent duplication of work.

## Development Workflow

To ensure consistency and quality, we follow a strict development workflow. Please adhere to the following guidelines.

### Branching

We use a Trunk-Based Development model. All work should be done in short-lived feature branches.

- **main**: The default and main branch. It must always be stable.
- **Feature Branches**: Name your branches using the convention `<type>/<short-description>`, where `<type>` is one of `feat`, `fix`, or `chore`.
  - Example: `feat/user-login-form`
  - Example: `fix/api-error-handling`

### Committing

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for our commit messages. This format allows for automated changelog generation and helps keep the project history clean and understandable.

A commit message should be structured as follows:

```
<type>(scope): <short description>

[optional body]

[optional footer]
```

- **type**: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, etc.
- **scope**: The part of the codebase you are changing (e.g., `auth`, `api`, `ui`).

### Pull Requests (PRs)

- All work must be submitted via a Pull Request (PR).
- Ensure your PR is small and focused on a single task.
- Your PR must pass all CI checks (linting, formatting, tests).
- Update documentation if you are changing any behavior.

### Code Style

- **Formatting**: We use Prettier for automated code formatting. Run `npm run format` before committing.
- **Linting**: We use ESLint to catch code quality issues. Run `npm run lint` to check your code.

By following these guidelines, you help us maintain a high-quality and collaborative development environment.
