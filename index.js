require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 5000;
const cors = require('cors');
const BankModel = require('./models/Bank')
const app = express();

app.use(express.json({limit: '50mb'}));
app.use(cors({
    credentials: true,
    origin: [process.env.CLIENT_URL]
}));

app.post('/createBank', async (req, res) => {
    try {
        const {name, maxLoan, minPayment, loanTerm, interestRate} = req.body;
        const findCreatedBank = await BankModel.find({name});
        if(findCreatedBank.length) {
            return res.status(500).json({message: 'Bank is already created'})
        }
        const result = await BankModel.create({name, maxLoan, minPayment, loanTerm, interestRate})
        return res.status(200).json(result);
    } catch (e) {
        console.log(e)
    }
})

app.post('/updateBank', async (req, res) => {
    try {
        const {_id,name, maxLoan, minPayment, loanTerm, interestRate} = req.body;
        const result = await BankModel.updateOne({_id},{name, maxLoan, minPayment, loanTerm, interestRate})

        return res.status(200).json(result);
    } catch (e) {
        console.log(e)
    }
})

app.post('/removeBank', async (req, res) => {
    try {
        const {name} = req.body;
        const findCreatedBank = await BankModel.find({name});
        if(!findCreatedBank.length) {
            return res.status(500).json({message: 'Bank is already deleted'})
        }
        const result = await BankModel.remove({name})
        return res.status(200).json({message: 'Bank was deleted!', result});
    } catch (e) {
        console.log(e)
    }
})

app.get('/getBanks', async(req, res) => {
    try {
        const result = await BankModel.find()
        return res.json(result);
    } catch (e) {
        console.log(e)
    }
})

app.post('/calculate', async(req, res) => {
    try {
        const {name, loan} = req.body;
        const result = await BankModel.findOne({name})
        let response = {}

        const term = result.loanTerm;
        const x = Number((result.interestRate/(100*12)).toFixed(16));
        const y = 1 + x;
        const z = Number(Math.pow(y, term).toFixed(16));
        let interestPaymentArr = [];
        let loanBalanceArr = [];
        let equityArr = [];
        let totalPaymentsArr = [];
        const totalPayment = Number((((loan - result.minPayment) * x * z)/(z-1)).toFixed(2));

        for(let i = 1; i <= term; i++) {
            let interestPayment
            if(i === 1) {
                interestPayment = (loan - result.minPayment) * x.toFixed(5)

                loanBalanceArr.push(Number(((loan - result.minPayment) - (totalPayment - interestPayment)).toFixed(2)))

                equityArr.push(Number((+result.minPayment + +totalPayment - +interestPayment).toFixed(2)))

            } else if( i === term) {
                if(loanBalanceArr[i-2] < totalPayment.toFixed(2)) {

                    const differentTotalPayment = totalPayment * term - (loan - result.minPayment);

                    let sumLoanBalance = 0;
                    for(let i = 0; i < interestPaymentArr.length; i++) {
                        sumLoanBalance += Number(interestPaymentArr[i].toFixed(2));
                    }
                    interestPayment = differentTotalPayment - sumLoanBalance;
                    response['sumLoanBalance'] = Number((sumLoanBalance + interestPayment).toFixed(2))
                    loanBalanceArr.push(0);

                    equityArr.push(Number((equityArr[i-2] + +totalPayment - +interestPayment).toFixed(2)))
                } else {
                    interestPayment =
                        loanBalanceArr[i-2] * x.toFixed(5)

                    loanBalanceArr.push(Number((loanBalanceArr[i-2] -
                        (totalPayment - interestPayment)).toFixed(2)))

                    equityArr.push(Number((equityArr[i-2] + +totalPayment - +interestPayment).toFixed(2)))
                }
            } else {
                interestPayment =
                    loanBalanceArr[i-2] * x.toFixed(5)

                loanBalanceArr.push(Number((loanBalanceArr[i-2] - (totalPayment - interestPayment)).toFixed(2)))

                equityArr.push(Number((equityArr[i-2] + +totalPayment - +interestPayment).toFixed(2)))
            }
            interestPaymentArr.push(Number(interestPayment.toFixed(2)));
            totalPaymentsArr.push(totalPayment)
        }
        response['totalPaymentsArr'] = totalPaymentsArr
        response['interestPaymentArr'] = interestPaymentArr
        response['loanBalanceArr'] = loanBalanceArr
        response['equityArr'] = equityArr
        response['term'] = result.loanTerm

        return res.status(200).json(response);
    } catch (e) {
        console.log(e)
    }
})

const start = async () => {
    try {
        await mongoose.connect(process.env.DB_URL,{useNewUrlParser: true, useUnifiedTopology: true })
        app.listen(PORT, () => console.log(`running on ${PORT}`))
    } catch (e) {
        console.log(e)
    }
}

start();