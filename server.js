const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// Connect to mongo
mongo.connect('mongodb://localhost:27017', function(err, cli){
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');
var db = cli.db('mongochat');
    // Connect to Socket.io
    client.on('connection', function(socket){
        let chat = db.collection('chats');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
                
            }

            // Emit the messages
            
            socket.emit('output', res);
            
        });

        // Handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;
            let time = data.time;
            let hr = data.hour;
            let mt = data.minute;
            let query={name:name,
                      message:message,
                      hour: hr,
                      minute:mt}
            // Check for name and message
            if(name == '' || message == '' || time== ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                
                // Insert message
                chat.insert(query, function(){
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
    
});