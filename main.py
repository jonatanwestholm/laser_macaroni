import numpy as np
import matplotlib.pyplot as plt

import networkx as nx

from sugarrush.solver import SugarRush

u = np.array([np.sqrt(3)/2, 3/2])
v = np.array([np.sqrt(3), 0])

def is_in_grid(N, i, j):
    if i < 0 or i >= N:
        return False

    if j < -np.floor(i/2) or j >= N - np.floor(i/2):
        return False

    return True

def main():
    solver = SugarRush()

    N = 5
    i_range = range(N)
    j_range = range(-int(np.floor(i/2)), N-int(np.floor(i/2)))

    tile2coord = { (i, j): (u[0] * i + v[0] * j, u[1] * i + v[1] * j) 
                    for i in i_range for j in j_range }

    """
    x, y, i, j = zip(*list(tiles))
    plt.scatter(list(x), list(y))
    broad_tiles = {(u[0] * i + v[0] * j, u[1] * i + v[1] * j, i, j) 
                    for i in range(-2, N+2) for j in range(-i-2, N+2)}
    x, y, i, j = zip(*list(broad_tiles))
    plt.scatter([xi + 0.1 for xi in x], list(y), color=["b" if is_in_grid(N, ii, ji) else "r" for ii, ji in zip(i, j)])
    plt.show()
    """

    T = solver.var() # dummy for always true
    solver.add([T]) 
    F = solver.var() # dummy for always false
    solver.add([-F])

    tile2var = {t: solver.var() for t in tile2coord.keys()}

    rot2diff = [(0, 1), (1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1)]

    edge2var = {}
    for i0 in i_range:
        for j0 in j_range:
            for rot in [0, 1, 2]:
                edge = (i0, j0, rot)
                di, dj = rot2diff[rot]
                if not is_in_grid(N, i+di, j+dj):
                    edge2var[edge] = F
                else:
                    edge2var[edge] = solver.var()

            for rot in [3, 4, 5]:
                edge = (i0, j0, rot)
                if not is_in_grid(N, i+di, j+dj):
                    if i0 == 0 and j0 == 0 and rot == 4:
                        edge2var[edge] = T
                    else:
                        edge2var[edge] = F
                else:
                    reverse_edge = (i+di, j+dj, (rot + 3) % 6)
                    edge2var[edge] = edge2var[reverse_edge]

    # make mutex constraints for evens and odds
    for tile in tile2var.keys():
        a, b, c = [edge2var[tile + (rot)] for rot in [0, 2, 4]]
        solver.add([[-a, -b], [-a, -c], [-b, -c]])
        a, b, c = [edge2var[tile + (rot)] for rot in [1, 3, 5]]
        solver.add([[-a, -b], [-a, -c], [-b, -c]])

    # make inertia constraints
    for tile, t in tile2var.items():
        for rot in range(6):
            x = edge2var[tile + (rot)]
            parant = edge2var[tile + ((rot + 3) % 6)]
            ommers = [edge2var[tile + ((rot + 1) % 6)], 
                      edge2var[tile + ((rot - 1) % 6)]]

            # ommers require the tile to be chosen
            solver.add([[t, -ommers[0], -x],
                        [t, -ommers[1], -x]])

            # the parant requires the tile to not be chosen
            solver.add([-t, -parant, -x])

    # limit the number of tiles picked
    max_tiles = 0
    solver.add(solver.atmost(list(tile2var.values()), max_tiles))

    # require certain tiles to be accessed by the laser, 
    # and not chosen as a turn
    checkpoints = [(0, 0)] # [(0, 0), (0, 1)]
    for tile in checkpoints:
        t = tile2var[tile]
        solver.add([-t])

        neighs = [tile + (rot) for rot in range(6)]
        neighs = [edge2var[neigh] for neigh in neighs]
        # need the laser to go in though at least one adjacent edge
        solver.add(neighs)

    # constraints to make tiles absorb the laser

    # how to prevent loops??

if __name__ == '__main__':
    main()