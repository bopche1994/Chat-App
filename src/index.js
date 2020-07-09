const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage,generatelLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app= express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT||3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

let count = 0
io.on('connection', (socket) => {
    console.log('New websocket connection')

    // socket.emit('countUpdated',count)

    // socket.on('increment', () => {
    //     count++
    //     // socket.emit('countUpdated',count)--emits an even to specific connection
    //     io.emit('countUpdated',count) /*emits an even to all connection*/
    // })


    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({id: socket.id, username, room})
        if(error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message',generateMessage('Admin', 'Welcome!'))

        socket.broadcast.to(user.room).emit('message',generateMessage('Admin', `${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()

    })
    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        const user = getUser(socket.id)
        if(!user){
            return callback()
        }
        io.to(user.room).emit('message',generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation',(coords, callback) => {
        // io.emit('message', `Location: ${coords.latitude}, ${coords.longitude}`)
        // io.emit('message', `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)
        const user = getUser(socket.id)
        if(!user){
            return callback()
        }
        io.to(user.room).emit('locationMessage', generatelLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', ` ${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
            
        }
        
    })

})

server.listen(port, () => {
    console.log('Server is up on port'+ port)
})

