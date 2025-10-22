# Building a Self-Merging PR System for GitHub

I wanted to build the world’s biggest open-source contributors list. A place where anyone could add their name with a pull request and become part of something massive.

Sounds simple, right? It is — until you realize that “anyone” could mean thousands of people. Reviewing and merging that many PRs manually? No chance. I needed something that could do all of it on its own.

So I built a self-merging PR system that validates, cleans, merges, and updates everything in about fifteen seconds, without me touching a thing. Here’s how it works.

---

## The problem

When you open a repo to the internet, you can’t rely on manual moderation.
People will fork, change whatever they want, and send a PR. Most will be fine. Some will break stuff. A few will test your patience.

I wanted a system that could:

* Accept PRs from forks (since contributors won’t have write access)
* Validate what they changed
* Merge automatically if everything looked good
* Reject or flag the rest

Basically, I wanted to press zero buttons.

---

## Figuring out the permissions

Here’s the first wall I hit.
GitHub restricts what you can do with PRs from forks. You can’t comment, label, or merge them directly using the default workflow trigger (`pull_request`).

The trick is to use `pull_request_target`, which runs in the context of the base repo instead of the fork. That gives the workflow the right permissions to do everything it needs.

To stay safe, I explicitly check out the PR commit, not the code from the fork’s workflow context. That way, if someone tries to slip in something malicious, it won’t run.

```yaml
on:
  pull_request_target:
    types: [opened, synchronize, reopened, ready_for_review]
    branches: [master]

- name: Checkout code
  uses: actions/checkout@v4
  with:
    ref: ${{ github.event.pull_request.head.sha }}
```

---

## Making the bot act like me

`GITHUB_TOKEN` is convenient, but it’s limited.
It can’t comment on fork PRs, it can’t bypass branch rules, and everything it does shows up as “github-actions[bot]”.

So I used a personal access token (PAT) with repo and workflow permissions, and made sure commits show up under my name.

```yaml
env:
  GH_TOKEN: ${{ secrets.PAT_TOKEN || secrets.GITHUB_TOKEN }}

- name: Setup Git
  run: |
    git config --global user.name "Sashank Bhamidi"
    git config --global user.email "hello@sashank.wiki"
```

Now the bot looks like me, comments like me, and merges PRs like me — but I’m not actually doing anything.

---

## Cleaning up duplicate triggers

At one point, I realized each time the workflow added or removed a label, it triggered itself again.
That led to duplicate comments and double merges.

I fixed it with a simple conditional check to skip when the event is label-related.

```yaml
if: github.event.action != 'labeled' && github.event.action != 'unlabeled'
```

Sometimes the best fix is the simplest one.

---

## Validating contributions

Every PR edits a single file called `ADD_YOUR_NAME.md`.
Inside, contributors follow this format:

```
- Name: Your Name
- Username: github-username
- Message: Optional message
```

The workflow checks a few things before merging:

1. The template structure is still there
2. The name and username are in the right format
3. The username hasn’t already been used
4. There’s no profanity
5. No other files were changed

The profanity check uses a free API (purgomalum.com). If the API is down, the PR just gets flagged for manual review instead of being approved blindly. Fail-closed, not fail-open.

---

## Auto-merging PRs

If the validation passes, the workflow approves, comments, labels, and merges.

```yaml
gh pr merge ${{ github.event.number }} --squash --auto
```

That single command does everything.
The `--auto` flag merges the PR the second all checks pass, and `--squash` keeps the commit history clean.

---

## What happens after a merge

Once a PR is merged, a second workflow runs. It pulls the new entry from `ADD_YOUR_NAME.md`, adds it to the main contributors list, sorts everything alphabetically, updates the count in the README, resets the template, and commits the changes.

If anything breaks mid-process, it rolls back automatically to a backup commit. That’s my safety net — no human debugging, no corrupted files.

---

## The result

From PR to merge to updated list, the whole thing runs in about fifteen seconds.
No manual reviews, no waiting, no stress.

It handles:

* Fork permissions
* Validation
* Duplicate prevention
* Profanity checks
* Auto-merging
* Rollbacks

It’s clean, fast, and works every single time.

---

## What this taught me

1. `pull_request_target` is powerful but needs guardrails.
2. PAT tokens open doors `GITHUB_TOKEN` can’t.
3. Always fail closed when user content is involved.
4. Validation saves time later.
5. Rollbacks are non-negotiable.

---

## Try it yourself

You can see the whole thing live at [**git-gang**](https://github.com/SashankBhamidi/git-gang).
Add your name, open a PR, and watch it merge itself. It takes fifteen seconds.

Goal’s ten thousand contributors. Started with ten. Let’s see where it goes.