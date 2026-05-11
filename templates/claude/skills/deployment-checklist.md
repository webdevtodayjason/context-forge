# Deployment checklist for {{projectName}}

This skill is the canonical pre-flight, deploy, and post-deploy procedure for
this project. Load it before shipping to production, before cutting a release,
or any time the user says "deploy", "ship", "push to prod", or asks about how
a release works here.

Target deploy environment: **{{deployTarget}}**.

Do not skip steps. The order matters. A failed step is a stop sign, not a
suggestion to retry harder.

## Pre-flight (before you touch the deploy command)

1. **Branch state**
   - You are on the intended release branch (usually `main` or `release/*`).
   - The working tree is clean (`git status` shows nothing).
   - The branch is up to date with the remote (`git pull --ff-only`).

2. **Tests and checks**
   - The full test suite passes locally.
   - Linter and type checker pass with no new warnings.
   - CI on the merge commit is green. Do not deploy a commit whose CI is
     red, pending, or skipped — chase down what skipped before continuing.

3. **Migrations and data**
   - If this release contains database migrations, they have been reviewed
     for backward compatibility with the **currently deployed** code, not
     just the new code. Long-running migrations are split out and applied
     ahead of the code change.
   - If this release deletes or renames a column, the column has already
     been deprecated and unused for at least one prior release.

4. **Config and secrets**
   - Any new environment variables are set in the target environment
     **before** the deploy. The app should not be the thing that surfaces
     a missing secret in production.
   - No secrets in the diff. Run `git log -p` against any new `.env*` file
     and confirm it is gitignored.

5. **Communication**
   - If this is a user-visible change, the team / customer / status page
     has been notified or scheduled appropriately.
   - You know who is on-call and they know a deploy is happening.

## Deploy

Run the deploy command for **{{deployTarget}}**:

```bash
# Replace this block with the project's actual deploy command.
# Examples by target:
#   Vercel:   vercel --prod
#   AWS ECS:  aws ecs update-service --service <name> --force-new-deployment
#   Coolify:  git push coolify main
#   Docker:   docker build -t <image> . && docker push <image> && <orchestrator-apply>
```

Watch the deploy logs in real time. Do not start unrelated work during the
deploy window — you are the one who will catch the regression first.

## Rollback

If anything in the post-deploy verification fails, roll back **before**
investigating. A broken production is not a debugging environment.

```bash
# Replace with the project's actual rollback command. Common patterns:
#   Vercel:    promote the previous deployment from the dashboard
#   AWS ECS:   aws ecs update-service --task-definition <previous-revision>
#   Coolify:   redeploy the previous commit
#   Generic:   git revert <commit> && deploy again
```

After rollback:

1. Confirm the previous version is serving traffic (hit a known endpoint).
2. Capture logs, error traces, and a timestamp from the failed deploy
   window. You will need them in the post-mortem.
3. Only then, dig into the cause.

## Post-deploy verification

Run these immediately after the deploy reports success:

- **Smoke test the critical user path.** Log in, complete the core action,
  log out. Do this against the production URL, not a preview.
- **Check error rates and latency** in whatever observability stack the
  project uses (Sentry, Datadog, CloudWatch, etc.) for at least 5 minutes
  after deploy. A spike that decays counts as a spike.
- **Verify background jobs and crons** are still firing — these are the
  silent killers, since they often don't error in a way users see.
- **Confirm new feature flags** behave the way they did in staging.

Only after all four of these are green is the deploy considered shipped.
Update the release log / changelog / status page accordingly.
