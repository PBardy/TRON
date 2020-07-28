// Constants
const TAU = Math.PI * 2;

// Interfaces

interface Vector2D {
  x:number;
  y:number;
  angle:number;
  magnitude:number;
  equals(vector:Vector):boolean;
  add(vector:Vector):Vector;
  subtract(vector:Vector):Vector;
  multiply(vector:Vector):Vector;
  divide(vector:Vector):Vector;
  scale(factor:number):Vector;
  normalise():Vector;
  dotProduct(vector:Vector):number;
  crossProduct(vector:Vector):Vector;
}

interface PlayerIntialState {
  name:string;
  color:string;
  position:Vector;
  direction:Vector;
  livesContainer:HTMLElement;
  boostsContainer:HTMLElement;
}

// Classes

class Vector implements Vector2D {

  public x: number;
  public y: number;

  public static NORTH:Vector = new Vector(0,-1);
  public static EAST:Vector = new Vector(1,0);
  public static SOUTH:Vector = new Vector(0,1);
  public static WEST:Vector = new Vector(-1,0);
  public static CARDINAL_DIRECTIONS = [Vector.NORTH, Vector.EAST, Vector.SOUTH, Vector.WEST];

  constructor(x:number, y:number) {
    this.x = x;
    this.y = y;
  }
  
  public get magnitude():number {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  public get angle():number {
    return Math.atan(this.y / this.x);
  }

  public equals(vector:Vector):boolean {
    return this.x === vector.x && this.y === vector.y;
  }

  public add(vector: Vector): Vector {
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  public subtract(vector: Vector): Vector {
    return new Vector(this.x - vector.x, this.y - vector.y);
  }

  public multiply(vector:Vector):Vector {
    return new Vector(this.x * vector.x, this.y * vector.y);
  }

  public divide(vector:Vector):Vector {
    if(vector.x === 0 || vector.y === 0) throw new Error("Cannot divide by zero");
    return new Vector(this.x / vector.x, this.y / vector.y);
  }

  public scale(factor: number): Vector {
    return new Vector(this.x * factor, this.y * factor);
  }

  public normalise(): Vector {
    throw new Error("Method not implemented.");
  }

  public dotProduct(vector: Vector): number {
    throw new Error("Method not implemented.");
  }

  public crossProduct(vector:Vector):Vector {
    throw new Error("Method not implemented.");
  }

  public static distance(a:Vector, b:Vector) {
    return Math.sqrt(Math.pow((b.x - a.x), 2) - Math.pow((b.y - a.y), 2));
  }

}


abstract class LightCycle {

  private color:string;
  private positions:Array<Vector> = new Array<Vector>();

  protected position:Vector;
  protected initialPosition:Vector;
  protected velocity:Vector;
  protected initialDirection:Vector;
  protected boosts:number = 3;
  protected boosting:boolean = false;

  private static readonly radius = 2;
  private static readonly boostEffect:number = 3;
  private static instances:Array<LightCycle> = new Array<LightCycle>();

  constructor(color:string, position:Vector, direction:Vector) {
    this.color = color;
    this.position = position;
    this.initialPosition = position;
    this.velocity = direction;
    this.initialDirection = direction;
    LightCycle.instances.push(this);
  }

  protected update():void {
    this.position = this.boosting 
      ? this.position.add(this.velocity.scale(LightCycle.boostEffect))
      : this.position.add(this.velocity);
  }

  private render(context:CanvasRenderingContext2D):void {
    context.beginPath();
    context.fillStyle = this.color;
    context.arc(this.position.x, this.position.y, LightCycle.radius, 0, TAU, false);
    context.fill();
    context.closePath();
  }

  protected useBoost():boolean {
    if(this.boosts <= 0) return false;
    if(this.boosting) return false;
    this.boosts--;
    this.boosting = true;
    setTimeout(() => (this.boosting = false), 1000);
    return true;
  }

  public turn(direction:Vector):void {
    if(this.velocity.x === direction.x) return;
    if(this.velocity.y === direction.y) return;
    this.velocity = direction;
  }

  public static resetPositions():void {
    LightCycle.instances.forEach((lightCycle:LightCycle) => {
      lightCycle.position = lightCycle.initialPosition; 
      lightCycle.velocity = lightCycle.initialDirection;
    });
  }

  public static render(context:CanvasRenderingContext2D):void {
    LightCycle.instances.forEach((lightCycle:LightCycle) => {
      lightCycle.render(context);
    });
  }

}


abstract class Player extends LightCycle {

  private lives:number = 3;
  private livesContainer:HTMLElement;
  private boostsContainer:HTMLElement;

  public name:string;

  private static players:Array<Player> = new Array<Player>();

  constructor(intialState:PlayerIntialState) {
    super(intialState.color, intialState.position, intialState.direction);

    this.name = intialState.name;
    this.livesContainer = intialState.livesContainer;
    this.boostsContainer = intialState.boostsContainer;
    Player.players.push(this);
  }

  public abstract chooseDirection(world:World):void;

  public getPosition():Vector {
    return this.position;
  }

  public getNextPosition():Vector {
    return this.position.add(this.velocity);
  }

  public boost():void {
    const canUseBoost:boolean = this.useBoost();
    if(!canUseBoost) return;
    const boosts:Array<HTMLElement> = Array.from(this.boostsContainer.querySelectorAll('.active'));
    const active:number = boosts.length;
    if(active <= 0) return;
    const boostToUse:HTMLElement = boosts[0];
    boostToUse.classList.remove('active');
  }

  public looseLife():boolean {
    if(this.lives <= 0) return true;
    this.lives--;
    this.livesContainer.innerHTML = this.lives.toString();
    return false;
  }

  public static update(world:World):Player {
    let collidingPlayer:Player = null;
    Player.players.forEach((player:Player) => {
      if(collidingPlayer) return;
      collidingPlayer = player;
      if(world.isNotWithinBounds(player.position)) return;
      if(world.addOccupiedPosition(player.position)) return;
      player.chooseDirection(world);
      player.update();
      collidingPlayer = null;
    });
    return collidingPlayer;
  }

}


class HumanPlayer extends Player {

  private static readonly publicName:string = "HumanPlayer";
  private static readonly color:string = "#5F94C5";
  private static readonly startPosition:Vector = new Vector(-150.5, 0.5);
  private static readonly startDirection:Vector = Vector.EAST;

  constructor(livesContainer:HTMLElement, boostsContainer:HTMLElement) {
    super({
      name: HumanPlayer.publicName,
      color: HumanPlayer.color,
      position: HumanPlayer.startPosition, 
      direction: HumanPlayer.startDirection,
      livesContainer: livesContainer,
      boostsContainer: boostsContainer
    });
  }

  public chooseDirection(world:World):void {
    return;
  }

}


class GraphNode {

  public object:any = null;
  public parent:GraphNode = null;

  constructor(object) {
    this.object = object;
  }

  public equals(node:GraphNode):boolean {
    return this.object === node.object;
  }

}


class ComputerPlayer extends Player {

  private opponent:Player;

  private static readonly publicName:string = "ComputerPlayer";
  private static readonly color:string = "#CC9C17";
  private static readonly startPosition:Vector = new Vector(150.5, 0.5);
  private static readonly startDirection:Vector = Vector.WEST;

  constructor(opponent:Player, livesContainer:HTMLElement, boostsContainter:HTMLElement) {
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

  private chooseNewDirection(world:World):void {

    let maxNeighbors:number = 0;
    let newDirection:Vector = null;
    for(let i = 0; i < Vector.CARDINAL_DIRECTIONS.length; i++) {
      const direction:Vector = Vector.CARDINAL_DIRECTIONS[i];
      const newPos:Vector = this.position.add(direction);
      if(!world.isOccupiedPosition(newPos) && world.isWithinBounds(newPos)) {
        const neighbors:Array<Vector> = world.getNeighbors(newPos);
        if(neighbors.length <= maxNeighbors) continue;
        maxNeighbors = neighbors.length;
        newDirection = direction;
      }
    }

    if(!newDirection) return;
    this.velocity = newDirection;
    const opponentPos:Vector = this.opponent.getPosition();
    const opponentOptions:number = world.getNeighbors(opponentPos).length;
    if(opponentOptions > 2) return;
    this.useBoost();

  }


  public aggressiveManeuver(world:World):void {
  
    let i:number = 0;
    let size:number = 100;
    let frontier:Array<GraphNode> = new Array<GraphNode>();
    let vicinity:Array<GraphNode> = new Array<GraphNode>();
    let start:GraphNode = new GraphNode(this.position);
    let target:GraphNode = new GraphNode(this.opponent.getPosition());

    frontier.push(start);

    while(i < size) {

      i++;
      let current:GraphNode = frontier.shift();

      if(current.equals(target)) {
        console.log("FOUND");
        return;
      }

      let neighbors:Array<Vector> = world.getNeighbors(current.object);

      for(let i = 0; i < neighbors.length; i++) {
        let neighbor:GraphNode = new GraphNode(neighbors[i]);
        if(vicinity.indexOf(neighbor) < 0) {
          vicinity.push(neighbor);
          if(frontier.indexOf(neighbor) < 0) {
            frontier.push(neighbor);
          }
        }
      }

    }
  }

  private evasiveManeuver(world:World):void {

    let greatestNeighborCount:number = 0;
    let bestChangeOfDirection:Vector = null;

    for(let i = 0; i < Vector.CARDINAL_DIRECTIONS.length; i++) {
      const direction:Vector = Vector.CARDINAL_DIRECTIONS[i];
      const potentialManeuver:Vector = this.position.add(direction);
      if(!world.isOccupiedPosition(potentialManeuver) && world.isWithinBounds(potentialManeuver)) {
        const neighbors:Array<Vector> = world.getNeighbors(potentialManeuver);
        if(neighbors.length <= greatestNeighborCount) continue;
        greatestNeighborCount = neighbors.length;
        bestChangeOfDirection = direction;
      }
    }

    if(bestChangeOfDirection) {
      this.velocity = bestChangeOfDirection;
    }

  }

  public chooseDirection(world:World):void {
    const nextPos:Vector = this.position.add(this.velocity);
    if(world.isOccupiedPosition(nextPos) || world.isNotWithinBounds(nextPos)) {
      this.aggressiveManeuver(world);
    } else {
      this.evasiveManeuver(world);
    }
  }

}


class World {

  private domParent:HTMLDivElement;
  private canvas:HTMLCanvasElement;
  private backgroundTileSize:number;
  private occupiedPositions:Array<Vector> = new Array<Vector>();
  public context:CanvasRenderingContext2D;

  constructor(div:HTMLDivElement) {
    this.domParent = div;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.domParent.clientWidth;
    this.canvas.height = this.domParent.clientHeight;
    this.backgroundTileSize = Math.floor(this.canvas.width / 20);
    this.context = this.canvas.getContext('2d');
    this.context.translate(this.hw, this.hh);
    this.domParent.appendChild(this.canvas);
  }

  private get hw():number {
    return this.canvas.width * 0.5;
  }

  private get hh():number {
    return this.canvas.height * 0.5;
  }

  private get width():number {
    return this.canvas.width;
  }

  private get height():number {
    return this.canvas.height;
  }

  private get topLeft():Vector {
    return new Vector(-this.hw, -this.hh);
  }

  private get bottomRight():Vector {
    return new Vector(this.hw, this.hh);
  }

  public getNeighbors(vector:Vector):Array<Vector> {
    const neighbors:Array<Vector> = new Array<Vector>();
    for(let i = 0; i < Vector.CARDINAL_DIRECTIONS.length; i++) {
      const direction:Vector = Vector.CARDINAL_DIRECTIONS[i];
      const node:Vector = vector.add(direction);
      if(this.isNotWithinBounds(node)) continue;
      if(this.isOccupiedPosition(node)) continue;
      neighbors.push(node);
    }

    return neighbors;
  }

  public clear():void {
    this.occupiedPositions = new Array<Vector>();
    this.context.clearRect(-this.hw, -this.hh, this.width, this.height);
  }

  public isOccupiedPosition(vector:Vector):boolean {
    return this.occupiedPositions.some(pos => pos.equals(vector));
  }

  public addOccupiedPosition(vector:Vector):boolean {
    if(this.isOccupiedPosition(vector)) return true;
    this.occupiedPositions.push(vector);
    return false;
  }

  public isWithinBounds(vector:Vector):boolean {
    return (
      (vector.x >= this.topLeft.x) && 
      (vector.x <= this.bottomRight.x) && 
      (vector.y >= this.topLeft.y) && 
      (vector.y <= this.bottomRight.y)
    );
  }

  public isNotWithinBounds(vector:Vector):boolean {
    return !this.isWithinBounds(vector);
  }

  public renderBackground():void {

    // draw lines of lattitude
    for(let i = -this.hw; i < this.canvas.width; i+= this.backgroundTileSize) {
      this.context.beginPath();
      this.context.strokeStyle = "#1B2828";
      this.context.lineWidth = 1;
      this.context.moveTo(i + 0.5, -this.hh + 0.5);
      this.context.lineTo(i + 0.5, this.canvas.height + 0.5);
      this.context.stroke();
      this.context.closePath();
    }

    // draw lines of longitude
    for(let i = -this.hh; i < this.canvas.height; i+= this.backgroundTileSize) {
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

  static instance:GameLogic;

  private world:World;
  private human:HumanPlayer;
  private computer:ComputerPlayer;
  private clockElement:HTMLElement;
  private messageContainer:Element;

  private gameEnded:boolean = false;
  private running:boolean = false;
  private paused:boolean = false;

  private FPS:number = 60;
  private FPS_INTERVAL:number = this.FPS/1000;
  private lastTime:number = 0;
  private clockSeconds:number = 0;
  private animationRef:number;

  private onKeyup(event:KeyboardEvent):void {
    if(event.keyCode === 32) this.start();
    if(event.keyCode === 80) this.togglePause();
    if(event.keyCode === 87) this.human.turn(Vector.NORTH);
    if(event.keyCode === 68) this.human.turn(Vector.EAST);
    if(event.keyCode === 83) this.human.turn(Vector.SOUTH);
    if(event.keyCode === 65) this.human.turn(Vector.WEST);
    if(event.keyCode === 66) this.human.boost();
  }

  private onWindowResize(event:Event):void {
    // TO-DO:
    // implement canvas resize
  }

  private stop():void {
    this.running = false;
    this.messageContainer.textContent = "Stopped";
    window.cancelAnimationFrame(this.animationRef);
  }

  private start():void {
    if(this.running) return;
    if(this.paused) return;
    this.running = true;
    this.paused = false;
    this.animationRef = window.requestAnimationFrame(this.mainloop.bind(this));
    this.messageContainer.textContent = "Let's Race";
  }

  private togglePause():void {
    this.paused ? this.unpause():this.pause();
  }

  private pause():void {
    this.running = false;
    this.paused = true;
    this.messageContainer.textContent = "Paused";
  }

  private unpause():void {
    this.running = true;
    this.paused = false;
    this.messageContainer.textContent = "Let's Race";
  }

  private endGame(collision):void {
    this.gameEnded = true;
    this.messageContainer.textContent = `${collision.name} loses.`;
    setTimeout(() => (window.location.href = '#leaderboard'), 3000);
  }

  private updateClock(delta:number):void {
    if(delta - this.lastTime >= 1000) {
      const mins:string = "0" + Math.floor(this.clockSeconds / 60).toString();
      const secs:string = "0" + Math.floor(this.clockSeconds % 60).toString();
      this.clockSeconds++;
      this.clockElement.innerHTML = `${mins.substr(mins.length - 2)}:${secs.substr(secs.length - 2)}`;
      this.lastTime = delta;
    } 
  }

  private onCollision(collision):void {
    this.stop();
    this.world.clear();
    this.world.renderBackground();
    this.messageContainer.textContent = "Press Space To Continue";
    LightCycle.resetPositions();
    LightCycle.render(this.world.context);
    const noLives:boolean = collision.looseLife();
    if(noLives) this.endGame(collision);
  }

  private mainloop(delta:number):void {
    if(this.gameEnded) return;
    this.animationRef = window.requestAnimationFrame(this.mainloop.bind(this));
    this.updateClock(delta);
    if(!this.running) return;
    const collisions = Player.update(this.world);
    if(collisions !== null) return this.onCollision(collisions);
    LightCycle.render(this.world.context);
  }

  public setup():void {

    // prepare dom container
    const playerOneLives:HTMLElement = document.querySelector('#playerOneLives');
    const playerTwoLives:HTMLElement = document.querySelector('#playerTwoLives');
    const playerOneBoosts:HTMLElement = document.querySelector('#playerOneBoosts');
    const playerTwoBoosts:HTMLElement = document.querySelector('#playerTwoBoosts');
    const container:HTMLDivElement = document.querySelector('.canvas-container');
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

  static getInstance():GameLogic {

    if(GameLogic.instance == null) {
      GameLogic.instance = new GameLogic();
    }

    return GameLogic.instance;
  }

}

GameLogic.getInstance().setup();