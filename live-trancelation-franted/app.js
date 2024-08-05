const recognition = new webkitSpeechRecognition();
recognition.continuous = true; // Keep listening
recognition.interimResults = true; // Show results while speaking
  
const audioPlayer = document.getElementById('audioPlayer');
let isPlaying = false;
let isListening = false;
let interimTranscript = '';
let finalTranscript = '';
let typingTimer;
const typingDelay = 1000; // Delay in milliseconds
if (!('webkitSpeechRecognition' in window)) {
    alert('Your browser does not support the Web Speech API. Please use Chrome.');
} else {
   

    document.getElementById('start').addEventListener('click', () => {
        if (!isListening) {
            recognition.start();
            isListening = true;
            console.log('Started listening...');
        }
    });

    document.getElementById('end').addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
            isListening = false;
            console.log('Stopped listening.');
        }
    });

    recognition.onresult = (event) => {
        interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript = event.results[i][0].transcript;
                clearTimeout(typingTimer);
                console.log('Voice to Text:', finalTranscript.trim());
                sendCall(finalTranscript.trim());

            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        // Print accumulated interim results after a pause
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            if (interimTranscript.trim() !== '' && interimTranscript !== finalTranscript) {
                // console.log('Voice to Text (interim):', interimTranscript.trim());
            }
        }, typingDelay);
    };

    recognition.onerror = (event) => {
        console.error('Error occurred in speech recognition:', event.error);
    };

    recognition.onend = () => {
        console.log('Recognition ended unexpectedly.');
        if (isListening) {
            // Optionally, restart recognition if it ended unexpectedly
            recognition.start();
            console.log('Restarted listening...');
        }
    };
}







let ws;
let username;
let call_status="no";
let SenderInfo;

function initWebSocket(username) {
    ws = new WebSocket('ws://localhost:8080/ws'); 

    ws.onopen = () => {
        console.log('WebSocket connection opened');
        // Send a login message to the server with the username
        ws.send(JSON.stringify({ type: 'login', username: username }));
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if(message.content=="you have a call"){
            SenderInfo=message;
            console.log(SenderInfo);
            callNotiFication(SenderInfo);
        }
        else if(message.content=="call accepted"){
            callAcepted();
        }else if(message.content=="Not acepted"){
            callNotAcepted();
        }
        else if(message.content=="call-droped"){
            stopColling();
        }
        else{
        displayMessage(message);
        if (message.recipient === username) {
            speakMessage(message.content);
        }
    }
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed');
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Handle user registration
function register() {
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const nativelanguage = document.getElementById('nativelanguage').value;
    const password = document.getElementById('registerPassword').value;

    if (username && email && password) {
        fetch('http://localhost:8080/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json','ngrok-skip-browser-warning': 'true' },
            body: JSON.stringify({ username, email, password ,nativelanguage})
        })
        .then(response => response.text())
        .then(data => {
            console.log('Register response:', data); // Debugging line to check response
            if (data.includes("User registered successfully")) {
                alert('Registration successful! Please log in.');
                document.getElementById('registerSection').style.display = 'none';
                document.getElementById('loginSection').style.display = 'block';
            } else {
                alert('Registration failed. Please try again.');
            }
        })
        .catch(error => console.error('Error registering user:', error));
    } else {
        alert('Please fill in all registration fields.');
    }
}

// Handle user login
function login() {
    username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (username && password) {
        fetch('http://localhost:8080/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
            body: JSON.stringify({ username, password })
        })
        .then(response => response.text())
        .then(data => {
            console.log('Login response:', data); // Debugging line to check response
            if (data.includes("Login successful!")) {
                document.getElementById('loginSection').style.display = 'none';
                document.getElementById('chatSection').style.display = 'block';
                initWebSocket(username);
            } else {
                alert('Login failed. Please check your credentials.');
            }
        })
        .catch(error => console.error('Error logging in:', error));
    } else {
        alert('Please enter both username and password.');
    }
}

// Handle sending messages
function sendMessage() {
    const recipient = document.getElementById('recipient').value;
    const content = document.getElementById('messageContent').value;

    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            sender: username,
            recipient: recipient,
            content: content,
            type: 'text'
        };

        ws.send(JSON.stringify(message));
        document.getElementById('messageContent').value = ''; // Clear message field
    } else {
        console.error('WebSocket is not open.');
    }
}

// Display messages in the chat window
function displayMessage(message) {
    const messageContainer = document.getElementById('messageContainer');
    const messageElement = document.createElement('div');
    messageElement.textContent = `${message.sender}: ${message.content}`;
    messageContainer.appendChild(messageElement);
}


// Speak the incoming message
function speakMessage(text) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
}

// Search for users
// Search for users
function searchUsers() {
    const query = document.getElementById('searchQuery').value;

    fetch(`http://localhost:8080/api/users/search?query=${query}`)
        .then(response => response.json())
        .then(users => {
            if (!Array.isArray(users)) {
                console.error('Expected an array of users');
                return;
            }
            const userList = document.getElementById('userList');
            userList.innerHTML = '';
            users.forEach(user => {
                const li = document.createElement('li');
                li.textContent = user.username;
                li.onclick = () => selectUser(user.username);
                userList.appendChild(li);
            });
        })
        .catch(error => console.error('Error fetching users:', error));
}

// Select a user from the search results
function selectUser(selectedUsername) {
    document.getElementById('recipient').value = selectedUsername;
}

// Handle enter key press for sending messages
document.getElementById('messageContent').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});











function sendCall(content) {
    const recipient = document.getElementById('recipient').value;
    // const content = document.getElementById('messageContent').value;

    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            sender: username,
            recipient: recipient,
            content: content,
            type: 'text'
        };

        ws.send(JSON.stringify(message));
        document.getElementById('messageContent').value = ''; // Clear message field
    } else {
        console.error('WebSocket is not open.');
    }
}



function messageSender(sender,recipient,content){


    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            sender: sender,
            recipient: recipient,
            content: content,
            type: 'text'
        };

        ws.send(JSON.stringify(message));
        document.getElementById('messageContent').value = ''; // Clear message field
    } else {
        console.error('WebSocket is not open.');
    }
}

function StartCall(){
    const recipient = document.getElementById('recipient').value;
    document.getElementById('in-call-popup').style.display = 'block';
    document.getElementById('call-status').style.value= 'waiting!!!';
    // const content = document.getElementById('messageContent').value;
    let notification="you have a call";
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            sender: username,
            recipient: recipient,
            content: notification,
            type: 'call'
        };

        ws.send(JSON.stringify(message));
        document.getElementById('messageContent').value = ''; // Clear message field
    } else {
        console.error('WebSocket is not open.');
    }
}


function callNotiFication(){

    document.getElementById('incoming-call-popup').style.display = 'block';
    playt();
}

function acceptButton(){
    if (!isListening) {
        document.getElementById('call-status').style.value= 'In call !!!';
        recognition.start();
        isListening = true;
        console.log('Started listening...');
    }
    poset();
    console.log("kese ho bhai");
console.log(SenderInfo);
selectUser(SenderInfo.sender);
messageSender(username,SenderInfo.sender,"call accepted");

document.getElementById('incoming-call-popup').style.display = 'none';

document.getElementById('in-call-popup').style.display = 'block';

}

function cutButton(){
    poset();
    console.log(SenderInfo);
    messageSender(username,SenderInfo.sender,"Not acepted");
    document.getElementById('incoming-call-popup').style.display = 'none';
   
    
}


function callAcepted(){
    
    if (!isListening) {
        document.getElementById('call-status').style.value= 'In call !!!';
        recognition.start();
        isListening = true;
        console.log('Started listening...');
    }

}

function callNotAcepted(){
    
    document.getElementById('in-call-popup').style.display = 'none';
}
// callll
function dropCall(){
    const recipient = document.getElementById('recipient').value;
    if (isListening) {
        recognition.stop();
        isListening = false;
        console.log('Stopped listening.');
    }
    messageSender(username,recipient,"call-droped");
    document.getElementById('in-call-popup').style.display = 'none';
    
}

function stopColling(){
    if (isListening) {
        recognition.stop();
        isListening = false;
        console.log('Stopped listening.');
    }
   
    document.getElementById('in-call-popup').style.display = 'none';
    
}

function playt(){
    audioPlayer.play();
    isPlaying=true;
}
function  poset(){
    audioPlayer.pause();
    isPlaying=false;
}