
const points = {
  A: [55, 180],
  B: [180, 65],
  C: [180, 295],
  D: [350, 180],
  E: [520, 65],
  F: [520, 295],
  G: [645, 180]
};

const edges = [
  ["A", "B", 2], ["A", "C", 4], ["B", "C", 1],
  ["B", "D", 4], ["C", "D", 2], ["B", "E", 7],
  ["D", "E", 2], ["D", "F", 3], ["E", "F", 1],
  ["E", "G", 5], ["F", "G", 2]
];

const start = "A";
const goal = "G";
const budget = 12;

let current, path, cost, moves, finished, showHint;

function neighbors(v) {
  return edges
    .filter(e => e[0] === v || e[1] === v)
    .map(e => e[0] === v ? e[1] : e[0]);
}

function edgeBetween(a, b) {
  return edges.find(e =>
    (e[0] === a && e[1] === b) ||
    (e[1] === a && e[0] === b)
  );
}

// Algoritmo de Dijkstra: encontra o menor custo.
function dijkstra() {
  const dist = {};
  const prev = {};
  const unvisited = new Set(Object.keys(points));

  Object.keys(points).forEach(v => dist[v] = Infinity);
  dist[start] = 0;

  while (unvisited.size) {
    let u = null;

    for (const v of unvisited) {
      if (u === null || dist[v] < dist[u]) u = v;
    }

    if (u === null || dist[u] === Infinity) break;

    unvisited.delete(u);
    if (u === goal) break;

    for (const v of neighbors(u)) {
      if (!unvisited.has(v)) continue;

      const candidate = dist[u] + edgeBetween(u, v)[2];

      if (candidate < dist[v]) {
        dist[v] = candidate;
        prev[v] = u;
      }
    }
  }

  const route = [];
  let v = goal;

  while (v !== undefined) {
    route.unshift(v);
    if (v === start) break;
    v = prev[v];
  }

  return { route, cost: dist[goal] };
}

const solution = dijkstra();

function svgEl(tag, attrs = {}, text = "") {
  const el = document.createElementNS(
    "http://www.w3.org/2000/svg", tag
  );

  Object.entries(attrs).forEach(([k, v]) =>
    el.setAttribute(k, v)
  );

  el.textContent = text;
  return el;
}

function tell(text, success = false) {
  const msg = document.getElementById("msg");
  msg.textContent = text;
  msg.style.color = success ? "#78e5c1" : "#f5f3ff";
}

function draw() {
  const map = document.getElementById("map");
  map.replaceChildren();

  edges.forEach(([a, b, w]) => {
    const [x1, y1] = points[a];
    const [x2, y2] = points[b];

    const line = svgEl("line", {
      x1, y1, x2, y2, class: "edge"
    });

    for (let i = 1; i < path.length; i++) {
      if (
        (path[i - 1] === a && path[i] === b) ||
        (path[i - 1] === b && path[i] === a)
      ) {
        line.classList.add("path");
      }
    }

    if (showHint) {
      for (let i = 1; i < solution.route.length; i++) {
        if (
          (solution.route[i - 1] === a && solution.route[i] === b) ||
          (solution.route[i - 1] === b && solution.route[i] === a)
        ) {
          line.classList.add("path");
        }
      }
    }

    map.appendChild(line);

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    map.appendChild(svgEl("rect", {
      x: mx - 12, y: my - 11,
      width: 24, height: 20, rx: 5, fill: "#302b4a"
    }));

    map.appendChild(svgEl("text", {
      x: mx, y: my + 5, class: "weight"
    }, String(w)));
  });

  Object.entries(points).forEach(([id, [x, y]]) => {
    const classes = ["node"];

    if (id === current) classes.push("current");
    if (id === goal) classes.push("goal");

    if (!finished && neighbors(current).includes(id)) {
      classes.push("next");
    }

    const g = svgEl("g", {
      class: classes.join(" "),
      tabindex: "0",
      role: "button",
      "aria-label": "Vértice " + id
    });

    g.appendChild(svgEl("circle", { cx: x, cy: y, r: 23 }));
    g.appendChild(svgEl("text", { x, y: y + 5 }, id));

    g.addEventListener("click", () => move(id));

    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        move(id);
      }
    });

    map.appendChild(g);
  });

  document.getElementById("cost").textContent = cost;
  document.getElementById("moves").textContent = moves;
}

function move(v) {
  if (finished || v === current) return;

  const edge = edgeBetween(current, v);

  if (!edge) {
    tell("Escolha um vértice vizinho conectado por uma aresta.");
    return;
  }

  cost += edge[2];
  moves++;
  current = v;
  path.push(v);
  showHint = false;

  if (cost > budget) {
    finished = true;
    tell("Orçamento ultrapassado! Reinicie e tente outra rota.");
  } else if (current === goal) {
    finished = true;

    const won = cost === solution.cost;

    tell(
      won
        ? `Parabéns! Você encontrou o menor caminho, com custo ${cost}!`
        : `Destino alcançado! Seu custo foi ${cost}. O menor custo possível é ${solution.cost}.`,
      won
    );
  } else {
    tell(`Você chegou ao vértice ${v}. Continue até G.`);
  }

  draw();
}

function reset() {
  current = start;
  path = [start];
  cost = 0;
  moves = 0;
  finished = false;
  showHint = false;

  tell("Saia do vértice A e chegue ao vértice G gastando o mínimo possível.");
  draw();
}

document.getElementById("reset").addEventListener("click", reset);

document.getElementById("hint").addEventListener("click", () => {
  showHint = !showHint;

  tell(showHint
    ? `Menor caminho: ${solution.route.join(" → ")}. Custo mínimo: ${solution.cost}.`
    : "Dica ocultada. Tente encontrar a melhor rota."
  );

  draw();
});

reset();
