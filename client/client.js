// Generated by CoffeeScript 1.12.7
(function() {
  var Client, Game, Message, exports,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  exports = window;

  Message = exports.WebPongJSMessage;

  Game = exports.WebPongJSClientGame;

  Client = (function() {
    Client.KEYS = {
      up: 38,
      down: 40,
      j: 74,
      k: 75
    };

    function Client(conf, board, messageBoard, scoreBoard) {
      this.conf = conf;
      this.onPoint = bind(this.onPoint, this);
      this.drawState = bind(this.drawState, this);
      this.onGameInput = bind(this.onGameInput, this);
      this.onGameUpdate = bind(this.onGameUpdate, this);
      this.onKeyUp = bind(this.onKeyUp, this);
      this.onKeyDown = bind(this.onKeyDown, this);
      this.onDrop = bind(this.onDrop, this);
      this.onUpdate = bind(this.onUpdate, this);
      this.onStart = bind(this.onStart, this);
      this.onInit = bind(this.onInit, this);
      this.blockId = null;
      this.initialDrift = null;
      this.board = board != null ? board : document.getElementById(this.conf.board.id);
      this.board.setAttribute('width', this.conf.board.size.x);
      this.board.setAttribute('height', this.conf.board.size.y);
      this.context = this.board.getContext('2d');
      this.messageBoard = messageBoard != null ? messageBoard : document.getElementById(this.conf.messageBoard.id);
      this.scoreBoard = scoreBoard != null ? scoreBoard : document.getElementById(this.conf.scoreBoard.id);
      this.callbacks = {
        init: this.onInit,
        start: this.onStart,
        update: this.onUpdate,
        drop: this.onDrop
      };
      this.newGame();
    }

    Client.prototype.start = function(sock) {
      var ref;
      this.sock = sock;
      this.sock = (ref = this.sock) != null ? ref : new SockJS("http://" + this.conf.server.addr + ":" + this.conf.server.port + this.conf.server.prefix);
      this.sock.onmessage = (function(_this) {
        return function(e) {
          var handler, msg;
          try {
            msg = Message.parse(e.data);
          } catch (error) {
            e = error;
            console.error("Error parsing message from server: " + e);
            throw e;
          }
          handler = _this.callbacks[msg.type];
          if (handler != null) {
            return handler(msg);
          } else {
            return console.error("Ignoring unknown message " + msg);
          }
        };
      })(this);
      this.sock.onopen = (function(_this) {
        return function() {
          _this.userMessage('Connected to server');
          return _this.send('init', null);
        };
      })(this);
      return this.sock.onclose = (function(_this) {
        return function() {
          _this.game.stop();
          _this.newGame();
          return _this.userMessage('No connection with server. Refresh the page to try again');
        };
      })(this);
    };

    Client.prototype.newGame = function() {
      this.game = new Game(this.conf);
      return this.game.setBlock(this.blockId);
    };

    Client.prototype.onInit = function(msg) {
      this.initialDrift = Number(msg.data.timestamp) - (new Date).getTime();
      this.blockId = msg.data.block;
      this.game.setBlock(this.blockId);
      this.updateScore(this.game.state.score);
      return this.userMessage('Waiting for other player');
    };

    Client.prototype.onStart = function(msg) {
      this.game.start(this.initialDrift);
      this.game.on('update', this.onGameUpdate);
      this.game.on('point', this.onPoint);
      this.game.on('input', this.onGameInput);
      document.onkeydown = this.onKeyDown;
      document.onkeyup = this.onKeyUp;
      return this.userMessage("Game running. Use the keyboard to control the " + this.conf.block.names[this.blockId] + " block");
    };

    Client.prototype.onUpdate = function(msg) {
      return this.game.addServerUpdate(msg.data);
    };

    Client.prototype.onDrop = function(msg) {
      this.game.stop();
      this.newGame();
      return this.userMessage('Other player dropped. Waiting for a new player to connect');
    };

    Client.prototype.send = function(msgType, msgData) {
      return this.sock.send((new Message(msgType, msgData)).stringify());
    };

    Client.prototype.userMessage = function(msg) {
      return this.messageBoard.innerHTML = msg;
    };

    Client.prototype.onKeyDown = function(ev) {
      switch (ev.keyCode) {
        case Client.KEYS.up:
        case Client.KEYS.k:
          return this.controlledBlock().movingUp = 1;
        case Client.KEYS.down:
        case Client.KEYS.j:
          return this.controlledBlock().movingDown = 1;
      }
    };

    Client.prototype.onKeyUp = function(ev) {
      switch (ev.keyCode) {
        case Client.KEYS.up:
        case Client.KEYS.k:
          return this.controlledBlock().movingUp = 0;
        case Client.KEYS.down:
        case Client.KEYS.j:
          return this.controlledBlock().movingDown = 0;
      }
    };

    Client.prototype.drawBlocks = function(blocks) {
      var b, i, j, len, results;
      results = [];
      for (i = j = 0, len = blocks.length; j < len; i = ++j) {
        b = blocks[i];
        this.context.beginPath();
        this.context.fillStyle = this.conf.block.colors[i];
        this.context.fillRect(b.x, b.y, b.width, b.height);
        this.context.closePath();
        results.push(this.context.fill());
      }
      return results;
    };

    Client.prototype.drawBall = function(x, y) {
      this.context.beginPath();
      this.context.fillStyle = this.conf.ball.color;
      this.context.arc(x, y, this.conf.ball.radius, 0, 2 * Math.PI, false);
      this.context.closePath();
      return this.context.fill();
    };

    Client.prototype.onGameUpdate = function(ev, state) {
      return this.drawState(ev, state);
    };

    Client.prototype.onGameInput = function(ev, inputEntry) {
      return this.send('input', inputEntry);
    };

    Client.prototype.drawState = function(ev, state) {
      this.context.clearRect(0, 0, this.board.width, this.board.height);
      this.drawBall(state.ball.x, state.ball.y);
      return this.drawBlocks(state.blocks);
    };

    Client.prototype.onPoint = function(ev, data) {
      return this.updateScore(data);
    };

    Client.prototype.updateScore = function(data) {
      return this.scoreBoard.innerHTML = data[0] + " : " + data[1];
    };

    Client.prototype.controlledBlock = function() {
      return this.game.state.blocks[this.blockId];
    };

    return Client;

  })();

  exports.WebPongJSClient = Client;

}).call(this);
