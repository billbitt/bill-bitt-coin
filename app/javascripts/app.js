// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import metacoin_artifacts from '../../build/contracts/MetaCoin.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
var MetaCoin = contract(metacoin_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;

window.App = {
  start: function() {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    MetaCoin.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.", err);
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

      // configure the page
      if (accounts){  // add accounts to the wallet drop-down menu
        for (var i = 0; i < accounts.length; i++){
          $("#wallet-select").append($("<option value='" + accounts[i] + "'>" + accounts[i] + "</option>" ));
        };
      };
      $("#wallet-select").on("change", function(event){  // add balance refresh event on wallet dropdown 
        //console.log(event);
        var selectedWallet = $(this).val().trim();
        console.log(selectedWallet);
        // handle case where no wallet is selected
        if (selectedWallet === "none"){
          var balance_element = document.getElementById("balance");
          balance_element.innerHTML = "?";
          return;
        }
        // display wallet balance 
        self.refreshBalance(selectedWallet);
      });
      $("#clipboard-copy-btn").on("click", function(){ // add copy-to-clipboard functionality
        console.log("clipboard button test1")
        var valueToCopy = document.createElement("input");
        valueToCopy.setAttribute("value", document.getElementById("wallet-select").value);
        console.log("valueToCopy", valueToCopy);
        document.body.appendChild(valueToCopy);
        valueToCopy.select();
        document.execCommand("copy");
        document.body.removeChild(valueToCopy);
      })

    });

  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  refreshBalance: function(walletAddress) {
    console.log("refreshing ", walletAddress);
    var self = this;

    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.getBalance.call(walletAddress, {from: walletAddress});
    }).then(function(value) {
      var balance_element = document.getElementById("balance");
      balance_element.innerHTML = value.valueOf();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting balance; see log.");
    });
  },

  sendCoin: function() {
    var self = this;

    var fromAccount = $("#wallet-select").val().trim();  // pull the from address from the dropdown 
    if (fromAccount === "none") { // check to make sure the dropdown address is valid 
      self.setStatus("The 'from' address you selected is not valid");
      return;
    }

    var amount = parseInt(document.getElementById("amount").value);
    var receiver = document.getElementById("receiver").value;

    this.setStatus("Initiating transaction... (please wait)");

    var meta;
    MetaCoin.deployed().then(function(instance) {
      meta = instance;
      return meta.sendCoin(receiver, amount, {from: fromAccount});
    }).then(function() {  // note: I've been having an issue getting past here 
      self.setStatus("Transaction complete!");
      self.refreshBalance(fromAccount);
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  }
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  App.start();
});
