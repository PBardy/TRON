// Constants
const TAU = Math.PI * 2;
// Classes
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    get magnitude() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    get angle() {
        return Math.atan(this.y / this.x);
    }
    equals(vector) {
        return this.x === vector.x && this.y === vector.y;
    }
    add(vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }
    subtract(vector) {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }
    multiply(vector) {
        return new Vector(this.x * vector.x, this.y * vector.y);
    }
    divide(vector) {
        if (vector.x === 0 || vector.y === 0)
            throw new Error("Cannot divide by zero");
        return new Vector(this.x / vector.x, this.y / vector.y);
    }
    scale(factor) {
        return new Vector(this.x * factor, this.y * factor);
    }
    normalise() {
        throw new Error("Method not implemented.");
    }
    dotProduct(vector) {
        throw new Error("Method not implemented.");
    }
    crossProduct(vector) {
        throw new Error("Method not implemented.");
    }
    static distance(a, b) {
        return Math.sqrt(Math.pow((b.x - a.x), 2) - Math.pow((b.y - a.y), 2));
    }
}
Vector.NORTH = new Vector(0, -1);
Vector.EAST = new Vector(1, 0);
Vector.SOUTH = new Vector(0, 1);
Vector.WEST = new Vector(-1, 0);
Vector.CARDINAL_DIRECTIONS = [Vector.NORTH, Vector.EAST, Vector.SOUTH, Vector.WEST];
class LightCycle {
    constructor(color, position, direction) {
        this.positions = new Array();
        this.boosts = 3;
        this.boosting = false;
        this.color = color;
        this.position = position;
        this.initialPosition = position;
        this.velocity = direction;
        this.initialDirection = direction;
        LightCycle.instances.push(this);
    }
    update() {
        this.position = this.boosting
            ? this.position.add(this.velocity.scale(LightCycle.boostEffect))
            : this.position.add(this.velocity);
    }
    render(context) {
        context.beginPath();
        context.fillStyle = this.color;
        context.arc(this.position.x, this.position.y, LightCycle.radius, 0, TAU, false);
        context.fill();
        context.closePath();
    }
    useBoost() {
        if (this.boosts <= 0)
            return false;
        if (this.boosting)
            return false;
        this.boosts--;
        this.boosting = true;
        setTimeout(() => (this.boosting = false), 1000);
        return true;
    }
    turn(direction) {
        if (this.velocity.x === direction.x)
            return;
        if (this.velocity.y === direction.y)
            return;
        this.velocity = direction;
    }
    static resetPositions() {
        LightCycle.instances.forEach((lightCycle) => {
            lightCycle.position = lightCycle.initialPosition;
            lightCycle.velocity = lightCycle.initialDirection;
        });
    }
    static render(context) {
        LightCycle.instances.forEach((lightCycle) => {
            lightCycle.render(context);
        });
    }
}
LightCycle.radius = 2;
LightCycle.boostEffect = 3;
LightCycle.instances = new Array();
class Player extends LightCycle {
    constructor(intialState) {
        super(intialState.color, intialState.position, intialState.direction);
        this.lives = 3;
        this.name = intialState.name;
        this.livesContainer = intialState.livesContainer;
        this.boostsContainer = intialState.boostsContainer;
        Player.players.push(this);
    }
    getPosition() {
        return this.position;
    }
    getNextPosition() {
        return this.position.add(this.velocity);
    }
    boost() {
        const canUseBoost = this.useBoost();
        if (!canUseBoost)
            return;
        const boosts = Array.from(this.boostsContainer.querySelectorAll('.active'));
        const active = boosts.length;
        if (active <= 0)
            return;
        const boostToUse = boosts[0];
        boostToUse.classList.remove('active');
    }
    looseLife() {
        if (this.lives <= 0)
            return true;
        this.lives--;
        this.livesContainer.innerHTML = this.lives.toString();
        return false;
    }
    static update(world) {
        let collidingPlayer = null;
        Player.players.forEach((player) => {
            if (collidingPlayer)
                return;
            collidingPlayer = player;
            if (world.isNotWithinBounds(player.position))
                return;
            if (world.addOccupiedPosition(player.position))
                return;
            player.chooseDirection(world);
            player.update();
            collidingPlayer = null;
        });
        return collidingPlayer;
    }
}
Player.players = new Array();
class HumanPlayer extends Player {
    constructor(livesContainer, boostsContainer) {
        super({
            name: HumanPlayer.publicName,
            color: HumanPlayer.color,
            position: HumanPlayer.startPosition,
            direction: HumanPlayer.startDirection,
            livesContainer: livesContainer,
            boostsContainer: boostsContainer
        });
    }
    chooseDirection(world) {
        return;
    }
}
HumanPlayer.publicName = "HumanPlayer";
HumanPlayer.color = "#5F94C5";
HumanPlayer.startPosition = new Vector(-150.5, 0.5);
HumanPlayer.startDirection = Vector.EAST;
class GraphNode {
    constructor(object) {
        this.object = null;
        this.parent = null;
        this.object = object;
    }
    equals(node) {
        return this.object === node.object;
    }
}
class ComputerPlayer extends Player {
    constructor(opponent, livesContainer, boostsContainter) {
        super({
            name: ComputerPlayer.publicName,
            color: ComputerPlayer.color,
            position: ComputerPlayer.startPosition,
            direction: ComputerPlayer.startDirection,
            livesContainer: livesContainer,
            boostsContainer: boostsContainter
        });
        this.opponent = opponent;
    }
    chooseNewDirection(world) {
        let maxNeighbors = 0;
        let newDirection = null;
        for (let i = 0; i < Vector.CARDINAL_DIRECTIONS.length; i++) {
            const direction = Vector.CARDINAL_DIRECTIONS[i];
            const newPos = this.position.add(direction);
            if (!world.isOccupiedPosition(newPos) && world.isWithinBounds(newPos)) {
                const neighbors = world.getNeighbors(newPos);
                if (neighbors.length <= maxNeighbors)
                    continue;
                maxNeighbors = neighbors.length;
                newDirection = direction;
            }
        }
        if (!newDirection)
            return;
        this.velocity = newDirection;
        const opponentPos = this.opponent.getPosition();
        const opponentOptions = world.getNeighbors(opponentPos).length;
        if (opponentOptions > 2)
            return;
        this.useBoost();
    }
    aggressiveManeuver(world) {
        let i = 0;
        let size = 100;
        let frontier = new Array();
        let vicinity = new Array();
        let start = new GraphNode(this.position);
        let target = new GraphNode(this.opponent.getPosition());
        frontier.push(start);
        while (i < size) {
            i++;
            let current = frontier.shift();
            if (current.equals(target)) {
                console.log("FOUND");
                return;
            }
            let neighbors = world.getNeighbors(current.object);
            for (let i = 0; i < neighbors.length; i++) {
                let neighbor = new GraphNode(neighbors[i]);
                if (vicinity.indexOf(neighbor) < 0) {
                    vicinity.push(neighbor);
                    if (frontier.indexOf(neighbor) < 0) {
                        frontier.push(neighbor);
                    }
                }
            }
        }
    }
    evasiveManeuver(world) {
        let greatestNeighborCount = 0;
        let bestChangeOfDirection = null;
        for (let i = 0; i < Vector.CARDINAL_DIRECTIONS.length; i++) {
            const direction = Vector.CARDINAL_DIRECTIONS[i];
            const potentialManeuver = this.position.add(direction);
            if (!world.isOccupiedPosition(potentialManeuver) && world.isWithinBounds(potentialManeuver)) {
                const neighbors = world.getNeighbors(potentialManeuver);
                if (neighbors.length <= greatestNeighborCount)
                    continue;
                greatestNeighborCount = neighbors.length;
                bestChangeOfDirection = direction;
            }
        }
        if (bestChangeOfDirection) {
            this.velocity = bestChangeOfDirection;
        }
    }
    chooseDirection(world) {
        const nextPos = this.position.add(this.velocity);
        if (world.isOccupiedPosition(nextPos) || world.isNotWithinBounds(nextPos)) {
            this.aggressiveManeuver(world);
        }
        else {
            this.evasiveManeuver(world);
        }
    }
}
ComputerPlayer.publicName = "ComputerPlayer";
ComputerPlayer.color = "#CC9C17";
ComputerPlayer.startPosition = new Vector(150.5, 0.5);
ComputerPlayer.startDirection = Vector.WEST;
class World {
    constructor(div) {
        this.occupiedPositions = new Array();
        this.domParent = div;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.domParent.clientWidth;
        this.canvas.height = this.domParent.clientHeight;
        this.backgroundTileSize = Math.floor(this.canvas.width / 20);
        this.context = this.canvas.getContext('2d');
        this.context.translate(this.hw, this.hh);
        this.domParent.appendChild(this.canvas);
    }
    get hw() {
        return this.canvas.width * 0.5;
    }
    get hh() {
        return this.canvas.height * 0.5;
    }
    get width() {
        return this.canvas.width;
    }
    get height() {
        return this.canvas.height;
    }
    get topLeft() {
        return new Vector(-this.hw, -this.hh);
    }
    get bottomRight() {
        return new Vector(this.hw, this.hh);
    }
    getNeighbors(vector) {
        const neighbors = new Array();
        for (let i = 0; i < Vector.CARDINAL_DIRECTIONS.length; i++) {
            const direction = Vector.CARDINAL_DIRECTIONS[i];
            const node = vector.add(direction);
            if (this.isNotWithinBounds(node))
                continue;
            if (this.isOccupiedPosition(node))
                continue;
            neighbors.push(node);
        }
        return neighbors;
    }
    clear() {
        this.occupiedPositions = new Array();
        this.context.clearRect(-this.hw, -this.hh, this.width, this.height);
    }
    isOccupiedPosition(vector) {
        return this.occupiedPositions.some(pos => pos.equals(vector));
    }
    addOccupiedPosition(vector) {
        if (this.isOccupiedPosition(vector))
            return true;
        this.occupiedPositions.push(vector);
        return false;
    }
    isWithinBounds(vector) {
        return ((vector.x >= this.topLeft.x) &&
            (vector.x <= this.bottomRight.x) &&
            (vector.y >= this.topLeft.y) &&
            (vector.y <= this.bottomRight.y));
    }
    isNotWithinBounds(vector) {
        return !this.isWithinBounds(vector);
    }
    renderBackground() {
        // draw lines of lattitude
        for (let i = -this.hw; i < this.canvas.width; i += this.backgroundTileSize) {
            this.context.beginPath();
            this.context.strokeStyle = "#1B2828";
            this.context.lineWidth = 1;
            this.context.moveTo(i + 0.5, -this.hh + 0.5);
            this.context.lineTo(i + 0.5, this.canvas.height + 0.5);
            this.context.stroke();
            this.context.closePath();
        }
        // draw lines of longitude
        for (let i = -this.hh; i < this.canvas.height; i += this.backgroundTileSize) {
            this.context.beginPath();
            this.context.strokeStyle = "#1B2828";
            this.context.lineWidth = 1;
            this.context.moveTo(-this.hw + 0.5, i + 0.5);
            this.context.lineTo(this.canvas.width + 0.5, i + 0.5);
            this.context.stroke();
            this.context.closePath();
        }
    }
}
class GameLogic {
    constructor() {
        this.gameEnded = false;
        this.running = false;
        this.paused = false;
        this.FPS = 60;
        this.FPS_INTERVAL = this.FPS / 1000;
        this.lastTime = 0;
        this.clockSeconds = 0;
    }
    onKeyup(event) {
        if (event.keyCode === 32)
            this.start();
        if (event.keyCode === 80)
            this.togglePause();
        if (event.keyCode === 87)
            this.human.turn(Vector.NORTH);
        if (event.keyCode === 68)
            this.human.turn(Vector.EAST);
        if (event.keyCode === 83)
            this.human.turn(Vector.SOUTH);
        if (event.keyCode === 65)
            this.human.turn(Vector.WEST);
        if (event.keyCode === 66)
            this.human.boost();
    }
    onWindowResize(event) {
        // TO-DO:
        // implement canvas resize
    }
    stop() {
        this.running = false;
        this.messageContainer.textContent = "Stopped";
        window.cancelAnimationFrame(this.animationRef);
    }
    start() {
        if (this.running)
            return;
        if (this.paused)
            return;
        this.running = true;
        this.paused = false;
        this.animationRef = window.requestAnimationFrame(this.mainloop.bind(this));
        this.messageContainer.textContent = "Let's Race";
    }
    togglePause() {
        this.paused ? this.unpause() : this.pause();
    }
    pause() {
        this.running = false;
        this.paused = true;
        this.messageContainer.textContent = "Paused";
    }
    unpause() {
        this.running = true;
        this.paused = false;
        this.messageContainer.textContent = "Let's Race";
    }
    endGame(collision) {
        this.gameEnded = true;
        this.messageContainer.textContent = `${collision.name} loses.`;
        setTimeout(() => (window.location.href = '#leaderboard'), 3000);
    }
    updateClock(delta) {
        if (delta - this.lastTime >= 1000) {
            const mins = "0" + Math.floor(this.clockSeconds / 60).toString();
            const secs = "0" + Math.floor(this.clockSeconds % 60).toString();
            this.clockSeconds++;
            this.clockElement.innerHTML = `${mins.substr(mins.length - 2)}:${secs.substr(secs.length - 2)}`;
            this.lastTime = delta;
        }
    }
    onCollision(collision) {
        this.stop();
        this.world.clear();
        this.world.renderBackground();
        this.messageContainer.textContent = "Press Space To Continue";
        LightCycle.resetPositions();
        LightCycle.render(this.world.context);
        const noLives = collision.looseLife();
        if (noLives)
            this.endGame(collision);
    }
    mainloop(delta) {
        if (this.gameEnded)
            return;
        this.animationRef = window.requestAnimationFrame(this.mainloop.bind(this));
        this.updateClock(delta);
        if (!this.running)
            return;
        const collisions = Player.update(this.world);
        if (collisions !== null)
            return this.onCollision(collisions);
        LightCycle.render(this.world.context);
    }
    setup() {
        // prepare dom container
        const playerOneLives = document.querySelector('#playerOneLives');
        const playerTwoLives = document.querySelector('#playerTwoLives');
        const playerOneBoosts = document.querySelector('#playerOneBoosts');
        const playerTwoBoosts = document.querySelector('#playerTwoBoosts');
        const container = document.querySelector('.canvas-container');
        container.innerHTML = "";
        // instantiate objects
        this.world = new World(container);
        this.human = new HumanPlayer(playerOneLives, playerOneBoosts);
        this.computer = new ComputerPlayer(this.human, playerTwoLives, playerTwoBoosts);
        this.clockElement = document.querySelector('#timer');
        this.messageContainer = document.querySelector('.message-container');
        this.messageContainer.textContent = "Press Space To Begin";
        // add event listeners
        window.addEventListener('keyup', this.onKeyup.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));
        // render initial world state
        this.world.renderBackground();
        LightCycle.render(this.world.context);
    }
    static getInstance() {
        if (GameLogic.instance == null) {
            GameLogic.instance = new GameLogic();
        }
        return GameLogic.instance;
    }
}
GameLogic.getInstance().setup();
//# sourceMappingURL=app.js.map