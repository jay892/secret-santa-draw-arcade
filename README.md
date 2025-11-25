<div align="center">
  <img src="src/logo.png" alt="Secret Santa Draw Arcade Logo" width="200">
</div>

# 🎮 Secret Santa Draw Arcade

_Because why just draw names when you can earn them through pixel-art arcade games?_

Every year I over-engineer our family's Secret Santa allocation. This year: a full 2D game platform built with Phaser.js. Participants play a randomly selected Christmas mini-game to unlock their Secret Santa assignment. No backend, no accounts, just pure client-side gaming fun.

Built one Thursday evening while exploring Composer 1 (Cursor's AI model) and Phaser.js game development.

## 🚀 Getting Started

```bash
bun install
bun dev    # Start development server
bun build  # Build for production
```

## 🎯 The Games

Each participant gets a random game challenge:

- **[Santa Maze](src/game/SantaMazeGame.ts)** - Navigate a peppermint maze, collect 3 ornaments , then reach the present
- **[Reindeer Delivery Dash](src/game/ReindeerDeliveryGame.ts)** - Fly Santa's sleigh through the sky and collect 3 stars
- **[Stocking Fill Match](src/game/StockingMatchGame.ts)** - Memory game: match 6 pairs of Christmas stockings
- **[Gift Stack Challenge](src/game/GiftStackingGame.ts)** - Balance and stack 8 falling gifts on a moving platform

Complete the challenge to reveal your Secret Santa recipient letter by letter!

## 📸 Screenshots

<!--
<table>
<tr>
<td width="50%">

**Event Creation**

![Event Creation](screenshots/event-creation.png)

</td>
<td width="50%">

**Secret Santa Revealed**

![Secret Santa Revealed](screenshots/reveal.png)

</td>
</tr>
<tr>
<td width="25%">

**Santa Maze**

![Santa Maze Game](screenshots/santa-maze.png)

</td>
<td width="25%">

**Reindeer Delivery Dash**

![Reindeer Delivery Dash](screenshots/reindeer-delivery.png)

</td>
<td width="25%">

**Stocking Fill Match**

![Stocking Fill Match](screenshots/stocking-match.png)

</td>
<td width="25%">

**Gift Stack Challenge**

![Gift Stack Challenge](screenshots/gift-stack.png)

</td>
</tr>
</table>
-->

## 📖 How It Works

1. Create your event and add participants
2. Set any exclusions (e.g., couples shouldn't get each other)
3. Generate unique game links for each participant
4. Share the links - each person plays their game to reveal their match

The allocation algorithm ensures valid pairings while respecting exclusions. All data is encoded in the URL, so there's no backend or database needed.

## Previous Years

This is part of my annual tradition of over-engineering Secret Santa:

- [2020 - Clojure Secret Santa](https://github.com/eddmann/clojure-secret-santa)
- [2021 - Pico Secret Santa](https://github.com/eddmann/pico-secret-santa)
- [2022 - Step Function Secret Santa](https://github.com/eddmann/step-function-secret-santa)
- [2023 - Secret Santa PWA](https://github.com/eddmann/secret-santa-pwa)
- [2024 - Secret Santa Draw](https://github.com/eddmann/secret-santa-draw)
- **2025 - Secret Santa Draw Arcade** ← You are here

## 📄 License

MIT
