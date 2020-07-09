const generateMessage = (username, message) => {
    return {
        username,
        text:message,
        createdAt: new Date().getTime(),
    }
}
const generatelLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generatelLocationMessage
}