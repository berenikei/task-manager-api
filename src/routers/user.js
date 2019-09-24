const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/authentication')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail } = require('../emails/account')
const { sendCancelEmail } = require('../emails/account')
 


/***************************** USERS MANAGER ****************************/

// create user and sign up
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (err) {
        res.status(400).send(err)
    }
})

// login user

router.post('/users/login', async (req, res) => {
    try {
    //creating a custom function in the Model
        const user = await User.findByCredentials(req.body.email, req.body.password)
        
        const token = await user.generateAuthToken()
        
        res.send({ user, token })
    } catch (error) {
        res.status(400).send()
    }
})

// logout user
router.post('/users/logout', auth, async (req, res, next) =>{
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
        next()
    } catch (error) {
        res.status(500).send()
    }
})

// logout ALL sessions
router.post('/users/logoutAll', auth, async(req, res) =>{
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()

    } catch (error) {
        res.status(500).send()
    }
})

// read users 
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

// //  read user - we shouldn't be able to do this unless it's our own profile
// router.get('/users/:id', async (req, res) => {
//     const _id = req.params.id

//     try {
//         const user = await User.findById(_id)
//         if (!user) {
//             return res.status(404).send()
//         }
//         res.send(user)
//     } catch (err) {
//         res.status(500).send()
//     }
// })

// update user by id - if it's my own profile
router.patch('/users/me', auth, async (req, res) => {
    // Object.keys() gives an array back 
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates'})
    }
    
    try {
        //const user = await User.findById(req.user._id)

        updates.forEach((update) =>  req.user[update] = req.body[update])
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true })  
        await req.user.save()
        res.send(req.user)
    } catch (err) {
        res.status(500).send(err)
    }
})

// delete user own profile
router.delete('/users/me', auth, async (req, res) => {
    try {
    //   const user = await User.findByIdAndDelete(req.user._id)
    //     if(!user){
    //         return res.status(404).send()
    //     }

    //mongoose methid remove()
        await req.user.remove()
        sendCancelEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (error) {
        res.status(500).send()
    }
})

// avatar 
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload a jpg, jpeg or png file!'))
        }
        cb(undefined, true)
    }
})

// upload avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

// delete avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

// serve up img
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar) {
            throw new Error()
        }

        // by default express sets this value to JSON 
         res.set('Content-Type', 'image/png')
         res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})



module.exports = router
