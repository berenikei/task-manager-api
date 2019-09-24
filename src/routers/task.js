const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/authentication')
const router = new express.Router()


/**************************** TASK MANAGER ****************************/

// create task
router.post('/tasks', auth, async(req, res) => {
    const task = new Task({
        //es6, copies everything form req.body
        ...req.body,
        //the owner will be the person who is authenticated
        owner: req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    } catch (err) {
        res.status(400).send(err)
    }
})

// read tasks
//filtering:
// GET /tasks?completed=true
//pagination: (options property in mongoose populate)
//  GET /tasks?limit=10&skip=0
//sorting: the value and the order 
// GET/tasks/sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if ( req.query.completed ) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        //name of the property we are setting on 'sort
        // ternary operator
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
        
    
    try {
        // const tasks = await Task.find({owner: req.user._id})
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
           
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (error) {
        res.status(500).send()
    }
})

// read task
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        // fetching a task searching its id, plus the owner id (the one who is logged in)
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (err) {
        res.status(500).send()
     }
})


// update task
router.patch('/tasks/:id', auth, async (req, res) => {
const updates = Object.keys(req.body)
const allowedUpdates = ['description', 'completed']
const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

if(!isValidOperation) {
    return res.status(400).send({error:'Invalid updates'})
}

try {
    //const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    const task = await Task.findOne({  _id: req.params.id, owner: req.user._id})
   // const task = await Task.findById(req.params.id)

    if(!task){
        res.status(404).send()
    }

    updates.forEach((update) => task[update] = req.body[update])
    await task.save()
    res.status(200).send(task)
} catch (error) {
    res.status(500).send(error)
}
})

// delete task

router.delete('/tasks/:id', auth,  async (req, res) =>{
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, owner:req.user._id})
        if(!task){
           return res.status(404).send()
        }
        res.status(200).send(task)
    } catch (error) {
        res.status(500).send()  
    }
})

module.exports = router