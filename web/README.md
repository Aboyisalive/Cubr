# web/ — web client

TypeScript, React, Vite, Three.js. Strict TypeScript, route-level code
splitting: the landing page loads instantly and the 3D scene is lazy-loaded
after first paint. One shared canvas, render loop driven from refs (never
React state), DPR capped, paused on hidden tabs. Offline history in IndexedDB.

First fragment: **F0.5** (Vite + React scaffold, design tokens, fonts).
Cube behavior comes from the TypeScript mirror of cube-core (F1.6) and the
generated API client (F0.3). Web enters cubes by manual entry on the 3D cube;
webcam scanning comes later.

Nothing here yet — F0.1 is scaffold only.
