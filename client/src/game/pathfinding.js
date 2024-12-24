import * as UTILS from "../../../src/js/utils.js";
import { players, buildings } from "../main.js";

class PathNode {
    constructor(x, y, wall) {
        this.x = x;
        this.y = y;

        this.walked = false;
        this.wall = wall;

        this.fScore = Infinity;
        this.gScore = Infinity;
        this.hScore = Infinity;
    }
}

export default class Pathfinder {
    static id = 0;
    static workers = [];

    static getWorkerCode() {
        return `
        var openSet = [];
        var pathMap = new Map();
        var grid = [];

        const Sqrt2 = Math.sqrt(3200); // a^2 + b^2 = c^2
        var startNode;
        var endNode;

        function distance(a, b) {
            return Math.hypot(a.x - b.x, a.y - b.y);
        }

        function getNeighbors(bestNode) {
            let neighbors = grid.filter(e => !e.wall && !e.walked && distance(e, bestNode) <= Sqrt2);
    
            return neighbors;
        }

        function tracePath(node) {
            let path = [];
            let current = node;
                
            while (current) {
                path.push(current);
                current = current.previous;
            }
            
            path.reverse();
            postMessage(path);
        }

        function find() {
            startNode.gScore = 0;
            startNode.hScore = distance(endNode, startNode);
            startNode.fScore = startNode.gScore + startNode.hScore;
    
            openSet.push(startNode);

            while (openSet.length > 0) {
                let bestNode = openSet.sort((a, b) => a.fScore - b.fScore)[0];
    
                bestNode.walked = true;
    
                let neighbors = getNeighbors(bestNode);
    
                for (let i = 0; i < neighbors.length; i++) {
                    let neighbor = neighbors[i];
    
                    neighbor.gScore = distance(bestNode, neighbor) + bestNode.gScore;
                    neighbor30Score = distance(endNode, neighbor);
                    neighbor.fScore = neighbor.gScore + neighbor.hScore;
    
                    if (neighbor.gScore < (pathMap.get(neighbor) || Infinity)) {
                        neighbor.previous = bestNode;
                        pathMap.set(neighbor, neighbor.gScore);
                        
                        if (neighbor == endNode) {
                            tracePath(neighbor);
                            openSet = [];
                            return;
                        }
    
                        if (!openSet.includes(neighbor)) {
                            openSet.push(neighbor);
                        }
                    }
                }
    
                let indx = openSet.findIndex(e => e == bestNode);
                openSet.splice(indx, 1);
            }

            postMessage("No path pls");
        }

        self.onmessage = function(event) {
            grid = event.data.grid;

            let { start, end } = event.data;

            startNode = grid.sort((a, b) => distance(a, start) - distance(b, start))[0];
            endNode = grid.sort((a, b) => distance(a, end) - distance(b, end))[0];

            if (startNode == endNode) {
                postMessage("No path");
            } else {
                find();
            }
        };
        `;
    }

    static search(start, end, { map, show, gameObjects }) {
        let cellRadius = 20;
        let grid = [];

        let min = {
            x: Math.floor(Math.min(start.x, end.x) / cellRadius * cellRadius) - (cellRadius * 2) * 30,
            y: Math.floor(Math.min(start.y, end.y) / cellRadius * cellRadius) - (cellRadius * 2) * 30
        };

        let max = {
            x: Math.floor(Math.max(start.x, end.x) / cellRadius * cellRadius) + (cellRadius * 2) * 30,
            y: Math.floor(Math.max(start.y, end.y) / cellRadius * cellRadius) + (cellRadius * 2) * 30
        };

        let difference = { x: max.x - min.x, y: max.y - min.y };

        let need = {
            x: Math.ceil(difference.x / cellRadius) / 2,
            y: Math.ceil(difference.y / cellRadius) / 2
        };

        for (let x = 0; x < need.x; x++) {
            for (let y = 0; y < need.y; y++) {
                let tmp = {
                    x: min.x + cellRadius * 2 * x,
                    y: min.y + cellRadius * 2 * y
                };

                if (tmp.x <= start.scale || tmp.x >= map.x - start.scale || tmp.y <= start.scale || tmp.y >= map.y - start.scale) continue;

                if ((gameObjects || buildings).find(e => tmp.x >= e.x - start.scale && tmp.x <= e.x + e.width + start.scale && tmp.y >= e.y - start.scale && tmp.y <= e.y + e.height + start.scale)) {
                    grid.push(new PathNode(tmp.x, tmp.y, true));
                } else if ((gameObjects || buildings).find(e => e.name == "healing beacon" && UTILS.getDistance(e, tmp) <= start.scale + 60)) {
                    grid.push(new PathNode(tmp.x, tmp.y, true));
                } else {
                    grid.push(new PathNode(tmp.x, tmp.y));
                }
            }
        }

        if (!show) {
            let id = this.id++;
            let blob = new Blob([this.getWorkerCode()], { type: "application/javascript" });
            let worker = new Worker(URL.createObjectURL(blob));

            worker.postMessage({
                grid,
                start,
                end
            });

            worker.onmessage = (event) => {
                if (typeof event.data == "object") {
                    let client = players.find(e => e.pathId == id);

                    if (client) {
                        client.pathData = event.data;
                        client.pathIndx = 0;
                    }
                } else {
                    let client = players.find(e => e.pathId == id);

                    if (client) {
                        client.pathId = -1;
                    }

                    console.log("No path found.");
                }

                worker.terminate();
            };

            return id;
        } else {
            return grid;
        }
    }
}