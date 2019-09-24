const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'hegedusberenike@gmail.com',
        subject: 'Test email from NodeJS',
        text: `Welcome to my new app, ${name}!
        I sent this app with NodeJS and I hope it is actually working.`,
        })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'hegedusberenike@gmail.com',
        subject: 'Bye bye :(',
        text: `Why are you leaving ${name}? :(`
        })
}
module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}
