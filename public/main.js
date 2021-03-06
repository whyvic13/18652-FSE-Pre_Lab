$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 5000; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];


  // Initialize varibles
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $userPassword = $('.userPassword');
  var $userPasswordAgain = $('.userPasswordAgain');
  var $messages = $('#chat'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box
  var $submit = $('.submit');
  var $register = $('.register');

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var username;
  var password;
  var passwordAgain;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput;

  var socket = io();

  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }

  // Sets the client's username
  function setUsername () {

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

      // Tell the server your username
      socket.emit('add user', username);
    }
    else{
      alert("invalid username");
    }
  }

  // Sends a chat message
  function sendMessage () {
    var message = $inputMessage.val();
    var myDate = new Date();
    //myDate.toLocaleString();     //获取当前日期
    //var mytime = myDate.toLocaleTimeString();     //获取当前时间
    var printTime = myDate.getMonth()+'.'+myDate.getDate()+'  '+myDate.toLocaleTimeString();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addOwnChatMessage({
        username: username,
        message: message,
        printTime: printTime
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', {message,printTime});
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<div class="name"></div>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<div class="message"></div>')
      .text(data.message);
      //
    var $messageTimeDiv = $('<div class="time"></div>')
      .text(data.printTime);
      //
    var typingClass = data.typing ? 'typing' : '';

    var $messageDiv = $('<div ng-class="{self: message.content.id==app.id}" class="bubble"></div>')
      .data('username', data.username)
      .css('display','inline-block')
      .append($usernameDiv, $messageBodyDiv, $messageTimeDiv);//

    //addMessageElement($messageDiv, options);
    $("#chat").append($messageDiv).append($("<br />")).animate({ scrollTop: $("#chat")[0].scrollHeight}, 500);
  }

  //Add Own Chat Message
  // Adds the visual chat message to the message list
  function addOwnChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<div class="name"></div>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<div class="message"></div>')
      .text(data.message);
      //
    var $messageTimeDiv = $('<div class="time"></div>')
      .text(data.printTime);
      //
    var typingClass = data.typing ? 'typing' : '';

    
    var $messageDiv = $('<div ng-class="{self: message.content.id==app.id}" class="Ownbubble"></div>')
      .data('username', data.username)
      .css({'display':'inline-block','background-color':'#33CC33'})
      .append($usernameDiv, $messageBodyDiv, $messageTimeDiv);//

    var $messageCoverDiv = $('<div class="word-content pull-right"></div>').append($messageDiv);
    //addMessageElement($messageDiv, options);
    
    $("#chat").append($messageCoverDiv).append($("<br />")).animate({ scrollTop: $("#chat")[0].scrollHeight}, 500)
    .append("<div style='clear: both;'></div>");
  }

  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    log(data.username+' '+data.message,true);
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });

  $inputMessage.on('input', function() {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $usernameInput.click(function () {
    $usernameInput.focus();
  });
  // Focus input when clicking anywhere on login page
  $userPassword.click(function () {
    $userPassword.focus();
  });
  //
  $userPasswordAgain.click(function () {
    $userPasswordAgain.focus();
  });
  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });
  // submit the username and password
  $submit.click(function(){
    //alert("click button");
    username = cleanInput($usernameInput.val().trim());
    password = cleanInput($userPassword.val());
    if(!username) alert("username cannot be empty");
    else if(!password) alert("password cannot be empty");
    else{
      socket.emit('check login',{name:username,psw:password});
    }
  });
  // register click
  $register.click(function(){
    username = cleanInput($usernameInput.val().trim());
    password = cleanInput($userPassword.val());
    passwordAgain = cleanInput($userPasswordAgain.val());
    if(!username) alert("username cannot be empty");
    else if(!password || !passwordAgain) alert("password cannot be empty");
    else if(password != passwordAgain) alert("passwords are not the same");
    else{
      socket.emit('check signup',{name:username,psw:password});
    }
  });


  // Socket events
  // Whenever the server emits 'check complete', judge the next step
  socket.on('check complete',function(data){
    if(data == 0) alert("no such user, please sign in first");
    else if(data == 1) setUsername();
    else if(data == 2) alert("wrong password!");
  });
  // Whenever the server emits 'check signup complete', judge the next step
  socket.on('check signup complete',function(data){
    if(data) alert("already has the same username");
    else setUsername();
  });
  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    if(data.username == username){
      addOwnChatMessage(data);
    }
    else{
      addChatMessage(data);
    }
    
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });
});
