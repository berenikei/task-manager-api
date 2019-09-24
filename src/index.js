const express = require('express')
require('./db/mongoose')

//routes
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

//express
const app = express()
const port = process.env.PORT


//automatically parse incoming JSON to an object
app.use(express.json())
app.use(userRouter)
app.use(taskRouter)


app.listen(port, () => {
    console.log('Server is up on port ' + port)
})


