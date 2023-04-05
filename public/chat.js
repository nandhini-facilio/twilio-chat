/* eslint-disable semi */
/* eslint-disable indent */
(function() {
    new Vue({
      el: "#app",
      data: {
        statusString: "",
        activeConversation: null,
        username: "",
        isConnected: false,
        messages: [],
        messageText: "",
        isSignedInUser: false,
      },
  
      // Initialize after component creation
      created: function() {
        window.facilioApp = FacilioAppSDK.init();
        window.facilioApp.on("app.loaded", (data) => {
            let isTenantPortal = data.currentUser.appDomain.appDomainTypeEnum == "TENANT_PORTAL";
            this.username = isTenantPortal ? 'Tenant' : 'Technician';
            this.registerUser();
            window.facilioApp.interface.trigger("open");
        });
      },
  
      computed: {},
  
      methods: {
        initConversationsClient: async function() {
          const token = await this.getToken(this.username);
          this.conversationsClient = new Twilio.Conversations.Client(token);
          this.statusString = "Connecting to Twilio…";
          this.conversationsClient.on("connectionStateChanged", (state) => {
            switch (state) {
              case "connected":
                this.statusString = "You are connected.";
                this.isConnected = true;
                this.createConversation();
                break;
              case "disconnecting":
                this.statusString = "Disconnecting from Twilio…";
                break;
              case "disconnected":
                this.statusString = "Disconnected.";
                break;
              case "denied":
                this.statusString = "Failed to connect.";
                break;
            }
          });
        },
        getToken: async function(identity) {
          const response = await fetch(`/auth/user/${identity}`);
          const responseJson = await response.json();
          return responseJson.token;
        },
        registerUser: async function() {
          await this.initConversationsClient();
        },
        createConversation: async function() {
          // Ensure User1 and User2 have an open client session
        //   try {
        //     await this.conversationsClient.getUser('nandhini+integration@facilio.com');
        //     await this.conversationsClient.getUser('nandhini+integration1@facilio.com');
        //   } catch {
        //     console.error("Waiting for User1 and User2 client sessions");
        //     return;
        //   }
          // Try to create a new conversation and add User1 and User2
          // If it already exists, join instead
          try {
            const newConversation = await this.conversationsClient.createConversation(
              { uniqueName: "faciliochat" }
            );
            const joinedConversation = await newConversation
              .join()
              .catch((err) => console.log(err));
            await joinedConversation
              .add('nandhini+integration@facilio.com')
              .catch((err) => console.log("error: ", err));
            await joinedConversation
              .add('nandhini+integration1@facilio.com')
              .catch((err) => console.log("error: ", err));
            this.activeConversation = joinedConversation;
          } catch {
            this.activeConversation = await this.conversationsClient.getConversationByUniqueName(
              "faciliochat"
            );
          }
  
          this.activeConversation.getMessages().then((newMessages) => {
            this.messages = [...this.messages, ...newMessages.items];
          });
          this.activeConversation.on("messageAdded", (message) => {
            this.messages = [...this.messages, message];
          });
        },
        sendMessage: function() {
          this.activeConversation.sendMessage(this.messageText).then(() => {
            this.messageText = "";
          });
        },
      },
    });
  })();
  