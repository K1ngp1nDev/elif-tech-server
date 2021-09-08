const {Schema, model} = require('mongoose')

const Bank = new Schema({
    name: {type: String, required: true, unique: true},
    maxLoan: {type: Number, required: true},
    minPayment: {type: Number, required: true},
    loanTerm: {type: Number, required: true},
    interestRate: {type: Number, required: true}
})

module.exports = model('Bank', Bank)