pragma solidity ^0.4.18;

/** @title Contains all the metadata required for a subscription plan */

contract Plan {

    address public owner; // The owner of the contract being the vendor in this case

    string public name; // Name of this plan (required)
    string public description; // Optional description (visible to user)
    string public identifier; // Optional product indentifier (hidden to user)

    // @TODO Implement this
    // bytes public metadata; // Optional data that a vendor may want to include

    uint public terminationDate; // Epoch time for when the plan is terminated by the vendor. Cannot be modified once set.
    uint public interval; // Measured in days (required). Cannot be modified once set.
    uint public amount; // Measured in cents (required). Cannot be modified once set.

    /**
      * Modifiers
    */

    modifier isOwner {
        require(msg.sender == owner);
        _;
    }

    /**
      * External functions
    */

    function terminatePlan(uint _terminationDate)
        isOwner
        external {
        require(_terminationDate >= block.timestamp);
        require(terminationDate == 0); // If it's already been set then we don't want it to be modified
        terminationDate = _terminationDate;
    }

    /**
      * Public functions
    */

    /** @dev This is the constructor function for creating a new plan
      * @param _owner the address which owns this contract and to which a payment will be made.
      * @param _name a front-end displaying name for the product
      * @param _interval after how many days should a customer be charged
      * @param _amount how much should the consumer be charged (in cents)
    */

    function Plan(
        address _owner,
        string _name,
        uint _interval,
        uint _amount
    )

        public
    {

        owner = _owner;
        name = _name;
        interval = _interval;
        amount = _amount;

    }

    /** @dev Updates the owner in case they want to receive funds in another address
      * @param _owner the address which they want to update it to
    */

    function setOwner(address _owner) 
        isOwner
        public {
        owner = _owner;
    }

    /** @dev Updates the name of the product (visible to the user)
      * @param _name the name which they want to update it to
    */

    function setName(string _name) 
        isOwner
        public {
        name = _name;
    }

    /** @dev Updates the description of the product (visible to the user)
      * @param _description the description which they want to update it to
    */

    function setDescription(string _description) 
        isOwner
        public {
        description = _description;
    }

    /** @dev Updates the identifier of the product (not visible to the user)
      * @param _identifier the identifier which they want to update it to
    */

    function setIdentifier(string _identifier) 
        isOwner
        public {
        identifier = _identifier;
    }

    /** @dev Get the interval for the plan
     */

    function getInterval()
        public
        view 
        returns (uint _interval) {
        return interval;
    }

    /** @dev Get the amount for the plan
     */

    function getAmount()
        public
        view 
        returns (uint _amount) {
        return amount;
    }
     

    /**
      * Internal functions
    */

    /**
      * Private functions
    */

}