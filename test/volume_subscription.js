import assertRevert from './helpers/assert_revert.js';
import keccak from './helpers/keccak.js';
import { newSubscription, newSubscriptionFull, newPlan } from './helpers/volume_subscription.js';

var VolumeSubscription = artifacts.require("./VolumeSubscription.sol");

contract('VolumeSubscription', function(accounts) {

    let contract;

    before(async function() {

      contract = await VolumeSubscription.new({from: accounts[0]});
        
    });

    /**
      * General
    **/

    it("should be able to intialise the plan contract correctly", async function() {

        let owner = await contract.owner.call();
        assert.equal(owner, accounts[0]);
      
    });

    /**
      * Collectable Implementation
    **/

    describe("when collecting money from the contract", () => {

        it("should be able to terminate as an authorized address", async function() {

            let subscriptionHash = await newSubscription(contract, accounts[0]);

            let now = Date.now();
            now = parseInt(now/1000);

            await contract.addAuthorizedAddress(accounts[0]);

            let termination = await contract.subscriptionOwnerDoesntHaveEnoughFunds(subscriptionHash, {from: accounts[0]});
            assert.equal(termination.logs[0].args.terminationDate, now);
        
            let terminationDate = await contract.getSubscriptionTerminationDate(subscriptionHash);
            assert.equal(terminationDate, now);
            
        });

        it("should be not be able to terminate as an unauthorized address", async function() {
            
            let subscriptionHash = await newSubscription(contract, accounts[0]);
            await assertRevert(contract.subscriptionOwnerDoesntHaveEnoughFunds(subscriptionHash, {from: accounts[1]}));
            
        });

        it("should be able to determine a valid subscription", async function() {

            let subscriptionHash = await newSubscription(contract, accounts[0]);
            let isValid = await contract.isValidSubscription(subscriptionHash);
            
            assert(isValid);

        });

        it("should be able to determine an invalid subscription", async function() {

            let subscriptionHash = await newSubscription(contract, accounts[0]);

            await contract.addAuthorizedAddress(accounts[1]);
            await contract.subscriptionOwnerDoesntHaveEnoughFunds(subscriptionHash, {from: accounts[1]});

            let isValid = await contract.isValidSubscription(subscriptionHash);
            
            assert(!isValid);
            
        });
        it("should be able to get the correct amount", async function() {

            let subscriptionHash = await newSubscription(contract, accounts[0]);
            let amount = await contract.getAmountDueFromSubscription(subscriptionHash);

            assert.equal(amount.toNumber(), 10);

        });

    });

    /**
      * Plan
    **/

    it("should have the correct computed plan hash", async function() {

        let planHash = await newPlan(contract, accounts[0], "test.identifier.1");
        let planIdentifier = await contract.getPlanIdentifier(planHash);

        let computedHash = keccak(
          ["address", "string"],
          [accounts[0], "test.identifier.1"]
        )

        assert.equal(planHash, computedHash);

    });

    describe("when creating a new plan", () => {

        it("should be able to create a new plan correctly", async function() {

            let planHash = await newPlan(contract, accounts[0], "test.identifier.2");
            let savedPlan = await contract.getPlan.call(planHash)

            assert.equal(savedPlan[0], accounts[0]);
            assert.equal(savedPlan[1], "test.identifier.2");
            assert.equal(savedPlan[2], "Test");
            assert.equal(savedPlan[3], "Description");
            assert.equal(savedPlan[4], 0);
            assert.equal(savedPlan[5], 30);
            assert.equal(savedPlan[6], 10);
            assert.equal(savedPlan[7], "{}");
        });

        it("should not be able to create a plan without required details", async function() {

            await assertRevert(contract.createPlan(0x0, "test.identifier", "", "", 30, 10, ""));
            await assertRevert(contract.createPlan(accounts[0], "", "", "", 30, 10, ""));
            await assertRevert(contract.createPlan(accounts[0], "test.identifier", "", "", 0, 10, ""));
            await assertRevert(contract.createPlan(accounts[0], "test.identifier", "", "", 30, 0, ""));

        });

        it("should not be able to create a plan with the same identifier", async function() {

            await contract.createPlan(accounts[0], "test.identifier", "", "", 30, 10, "");
            await assertRevert(contract.createPlan(accounts[0], "test.identifier", "", "", 30, 10, ""));


        });

    });

    describe("when updating the owner of a plan", () => {

        it("should be able to update as the owner", async function() {

            let planHash = await newPlan(contract, accounts[0]);

            await contract.setPlanOwner(planHash, accounts[1], {from: accounts[0]});

            let owner = await contract.getPlanOwner(planHash);
            assert.equal(owner, accounts[1]);

            await contract.setPlanOwner(planHash, accounts[0], {from: accounts[1]});

            owner = await contract.getPlanOwner(planHash);
            assert.equal(owner, accounts[0]);
        
        });

        it("should be not be able to update the owner as another user", async function () {

            let planHash = await newPlan(contract, accounts[0]);
            await assertRevert(contract.setPlanOwner(planHash, accounts[1], {from: accounts[1]}));

        });
    
    });

    describe("when updating the name of a plan", () => {

        it("should be able to update as the owner", async function() {
            
            let planHash = await newPlan(contract, accounts[0]);

            let savedPlan = await contract.getPlan.call(planHash)

            await contract.setPlanName(planHash, "Another test", {from: accounts[0]});

            let name = await contract.getPlanName(planHash); 
            assert.equal(name, "Another test");
        
        });

        it("should be not be able to update as another user", async function () {

            let planHash = await newPlan(contract, accounts[0]);
            await assertRevert(contract.setPlanName(planHash, "Another test", {from: accounts[1]}));
            
        });

    });

    describe("when updating the description of a plan", () => {

        it("should be able to update as the owner", async function() {

            let planHash = await newPlan(contract, accounts[0]);

            await contract.setPlanDescription(planHash, "Test description");

            let description = await contract.getPlanDescription(planHash);
            assert.equal(description, "Test description");
        
        });

        it("should be not be able to update as another user", async function () {

            let planHash = await newPlan(contract, accounts[0]);

            await assertRevert(contract.setPlanDescription(planHash, "Test description", {from: accounts[1]}));

        });

    });

    describe("when updating the data of a plan", () => {

        it("should be able to update as the owner", async function() {

            let planHash = await newPlan(contract, accounts[0]);

            await contract.setPlanData(planHash, "{hey: there}");
        
            let data = await contract.getPlanData(planHash);
            assert.equal(data, "{hey: there}");
            
        });
        
        it("should be not be able to update as another user", async function () {
        
            let planHash = await newPlan(contract, accounts[0]);

            await assertRevert(contract.setPlanData(planHash, "{hey: there}", {from: accounts[1]}));
        
        });

    });

    describe("when terminating a plan", () => {

        it("should be able to terminate as the owner", async function() {

            let planHash = await newPlan(contract, accounts[0]);

            let now = Date.now();
            now = parseInt(now/1000);

            let termination = await contract.terminatePlan(planHash, now);
            assert.equal(termination.logs[0].args.terminationDate, now);

            let terminationDate = await contract.getPlanTerminationDate(planHash);
            assert.equal(terminationDate, now);
          
        });

        it("should not be able to terminate multiple times", async function() {

            let planHash = await newPlan(contract, accounts[0]);

            let now = Date.now();
            now = parseInt(now/1000);

            let secondDate = new Date(Date.now() + (60*60*1000)).valueOf();
            secondDate = parseInt(secondDate/1000);

            await contract.terminatePlan(planHash, now);
            await assertRevert(contract.terminatePlan(planHash, secondDate));

        });
        
        it("should not be able to terminate from a date in the past", async function() {

            let planHash = await newPlan(contract, accounts[0]);

            let past = new Date(Date.now() - (60*60*1000)).valueOf();
            past = parseInt(past/1000);

            await assertRevert(contract.terminatePlan(planHash, past));

        });

        it("should not be able to terminate as another user", async function () {

            let planHash = await newPlan(contract, accounts[0]);

            let now = Date.now();
            now = now/1000;

            await assertRevert(contract.terminatePlan(planHash, now, {from: accounts[1]}));
          
        });
    
    });

    describe("when updating the data of a subscription", () => {

        it("should be able to update as the owner", async function() {

            let subscriptionHash = await newSubscription(contract, accounts[0]);
            await contract.setSubscriptionData(subscriptionHash, "{hey: there}", {from: accounts[0]});
        
            let data = await contract.getSubscriptionData(subscriptionHash);
            assert.equal(data, "{hey: there}");
            
        });

        it("should be not be able to update as another user", async function () {

            let subscriptionHash = await newSubscription(contract, accounts[0]);
            await assertRevert(contract.setSubscriptionData(subscriptionHash, "{hey: there}", {from: accounts[1]}));

        });

    });

    /**
      * Subscription
    **/

   it("should have the correct computed subscription hash", async function() {

        let hashes = await newSubscriptionFull(contract, accounts[0]);

        let computedHash = keccak(
        ["address", "bytes32"],
        [accounts[0], hashes[0]]
        );

        assert.equal(hashes[1], computedHash);

    });

    describe("when terminating a subscription", () => {

        it("should be able to terminate as the owner", async function() {

            let subscriptionHash = await newSubscription(contract, accounts[0])

            let now = Date.now();
            now = parseInt(now/1000);
        
            let termination = await contract.terminateSubscription(subscriptionHash, now);
            assert.equal(termination.logs[0].args.terminationDate, now);
        
            let terminationDate = await contract.getSubscriptionTerminationDate(subscriptionHash);
            assert.equal(terminationDate, now);
            
        });

        it("should not be able to terminate multiple times", async function() {
        
            let subscriptionHash = await newSubscription(contract, accounts[0]);

            let now = Date.now();
            now = parseInt(now/1000);
        
            let secondDate = new Date(Date.now() + (60*60*1000)).valueOf();
            secondDate = parseInt(secondDate/1000);
        
            await contract.terminateSubscription(subscriptionHash, now);
            await assertRevert(contract.terminateSubscription(subscriptionHash, secondDate));
        });
        
        it("should not be able to terminate from a date in the past", async function() {
        
            let subscriptionHash = await newSubscription(contract, accounts[0])

            let past = new Date(Date.now() - (60*60*1000)).valueOf();
            past = parseInt(past/1000);
        
            await assertRevert(contract.terminateSubscription(subscriptionHash, past));
        
        });
        
        it("should not be able to terminate as another user", async function () {
        
            let subscriptionHash = await newSubscription(contract, accounts[0])

            let now = Date.now();
            now = now/1000;
        
            await assertRevert(contract.terminateSubscription(subscriptionHash, now, {from: accounts[1]}));
            
        });

    });

});