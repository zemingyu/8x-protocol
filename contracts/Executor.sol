pragma solidity 0.4.24;

import "./base/ownership/Ownable.sol";
import "./Collectible.sol";
import "./TransferProxy.sol";

/** @title Contains all the data required for a user's active subscription. */
/** @author Kerman Kohli - <kerman@TBD.com> */

contract Executor is Ownable {

    TransferProxy public transferProxy;

    /**
      * PUBLIC FUNCTIONS
    */
    function setTransferProxy(address _proxyAddress)
        public
        onlyOwner
    {
        transferProxy = TransferProxy(_proxyAddress);
    }

    /** @dev Collect the payment due from the subscriber.
      * @param _subscriptionContract is the contract where the details exist(adheres to Collectible contract interface).
      * @param _subscriptionIdentifier is the identifier of that customer's
      * subscription with its relevant details.
    */
    function collectPayment(
        address _subscriptionContract,
        bytes32 _subscriptionIdentifier)
        public
        returns (bool success)
    {

        Collectible collectibleContract = Collectible(_subscriptionContract);

        // Check if the subscription hasn't been cancelled
        require(collectibleContract.isValidSubscription(_subscriptionIdentifier) == true);

        address tokenAddress = collectibleContract.getSubscriptionTokenAddress(_subscriptionIdentifier);
        address from;
        address to;
        (from, to) = collectibleContract.getSubscriptionFromToAddresses(_subscriptionIdentifier);

        uint ownerBalance = collectibleContract.getSubscriptionOwnerBalance(_subscriptionIdentifier);
        uint amountDue = collectibleContract.getAmountDueFromSubscription(_subscriptionIdentifier);
        uint collectorFee = collectibleContract.getSubscriptionFee(_subscriptionIdentifier);

        // Check if subscriber has enough balance and withdraw amountDue
        if (ownerBalance > amountDue) {
            // send fee to collector
            transferProxy.transferFrom(tokenAddress, from, msg.sender, collectorFee);
            // send (amountDue - collectorFee) to plan owner
            transferProxy.transferFrom(tokenAddress, from, to, amountDue - collectorFee);
            // return success
            return true;
        }

        // If the payment couldn't be collected, terminate.
        collectibleContract.terminateSubscriptionDueToInsufficientFunds(_subscriptionIdentifier);
        return false;
    }

}