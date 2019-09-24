const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Password cannot contain password')
            }
        }
    },

    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) {
                throw new Error ('Age must be a positive number')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer,
    }
}, {
    timestamps: true
})
//virtual property: not real data stored, just a relation between two entitites
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

// at login inly send the public data back
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}

// generating tokens and saving them to the database
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)
   
    user.tokens = user.tokens.concat({  token })
    await user.save()

    return token
}

//set this up so it can be called in logging in in the routers
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})
    //check if user exists 
    if(!user) {
        throw new Error('Unable to log in')
    }
    // compare the input pw with the hashed pw
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

//Hasing the plain text before saving  MIDDLEWARE
userSchema.pre('save', async function (next) {
    const user = this

    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

//MIDDLEWARE
// delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    //delete multiple taskss using the owner field
    await Task.deleteMany({ owner: user._id })

    next()
})


const User = mongoose.model('User', userSchema)

module.exports = User