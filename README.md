# 2D Game

## Summary

Created using Claude Code - initial request "Create a 2D web browser dungeon crawler game with randomly generated levels, responsive on mobile".

## Dev Containers

To enable Claude (and yourself) to push to GitHub from the dev container add a `GH_TOKEN=xxx` line into .devcontainer/.env.devcontainer with `xxx` as your GitHub access token for accessing this repository. New tokens can be created here <https://github.com/settings/personal-access-tokens/new>.

### Troubleshooting

If containers are not rebuilding after changing devcontainer.json, Dockerfile, init-firewall.sh or any other dependencies choose 'Dev Containers: Rebuild Without Cache and Reopen in Container' instead of 'Dev Containers: Rebuild and Reopen in Container' as the latter uses a cache when building the container images which can sometimes miss your changes.

If this doesn't work then try running `docker buildx prune` from a terminal to forcefully clear out the docker build cache.

## TODO

### Bugs

- Inventory window does not change the currently equipped weapon/armour name when clicked (it does change the equipped state, just not the text)

### Documentation

- add to this README.md instructions on building and running the app
- add to this README.md information about the chosen frameworks
- add to this README.md information about key design choices

### General

- music
- bosses - unique (once per run) and repeatable (champions?)
- remote deployment/hosting for app
- stats - deepest level reached, monster types kill count, unique bosses kill count
- achievements - hide achievements until completed, hints. Examples 'Burrower - reached level 10' (hint 'reach level 10'), with some more cryptic: achievement 'Hoarder - gained 100g' (hint 'what would Smaug do?')

### Inventory

- arrow keys to move around inventory (no mouse)
- show details of inventory item when highlighted

### UI

- mobile controls on mobile only
- map - press 'm'

### Enemies

- enemy health - perhaps a health bar
- enemy types

### Character

- hold keys for continued movement
- compressed movement - if nothing new then SHIFT-direction keeps going until an obstacle is hit
- character graphic
- detailed status
- xp bar - make it clearer that it is an XP bar

### Saving

- save between sessions
- multiple save slots
- cloud save (Google?)

## References

- <https://code.claude.com/docs/en/devcontainer>
- <https://nakamasato.medium.com/using-claude-code-safely-with-dev-containers-b46b8fedbca9>
- <https://github.com/anthropics/claude-code/issues/15611>
