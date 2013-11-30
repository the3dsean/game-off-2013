function DialogueSequence( sequence ){

	var targetStory = story[sequence] ? story[sequence].slice(0) : messages[sequence].slice(0);

	return {
		next: function(){
			return targetStory.shift().split(": ");
		},
		more: function(){
			return targetStory.length > 0;
		}
	}
}

function DialogUI( stage, gameState ){
	var that = this;
	// Dialog States
	var DIALOG_RECEDING = 0;
	var DIALOG_SHOWING = 1;
	var DIALOG_PAUSING = 2;
	var MILLIS_PER_CHAR = 150;

	var peopleImg = {
		"Boyfriend": new createjs.Bitmap("res/people/Boyfriend.png"),
		"Brother": new createjs.Bitmap("res/people/Brother.png"),
		"Cat": new createjs.Bitmap("res/people/Cat.png"),
		"Dad": new createjs.Bitmap("res/people/Dad.png"),
		"Girlfriend": new createjs.Bitmap("res/people/Girlfriend.png"),
		"Grandma": new createjs.Bitmap("res/people/Grandma.png"),
		"Grandpa": new createjs.Bitmap("res/people/Grandpa.png"),
		"Mom": new createjs.Bitmap("res/people/Mom.png"),
		"Female": new createjs.Bitmap("res/people/PlayerFemale.png"),
		"Male": new createjs.Bitmap("res/people/PlayerMale.png")
	};

	var dialogueList = Object.keys(story);

	this.dialogSpeed = 30;
	this.dialogState = DIALOG_PAUSING;

	this.dialogMotionQueue = [DIALOG_RECEDING];
	this.currDialogueSeq = new DialogueSequence("Null");
	dialogQueue = [];

	this.dialogBox = new createjs.Bitmap("res/screens/GUI/DialogueBox.png");
	this.dialogBox.x = 0;
	this.dialogBox.y = 250;

	this.currentFace = peopleImg["Male"];
	this.currentFace.x = 0;

	this.textContent = new createjs.Text( "", "24px Arial", "#00000000" );
	this.textContent.x = 205;
	this.textContent.y = 705;
	this.textContent.lineWidth = 565;
	this.textContent.lineHeight = 30;
	this.textContent.textBaseline = "alphabetic";

	this.dialogBox.addEventListener( "mouseover", function(){ document.body.style.cursor='pointer'; } );
 	this.dialogBox.addEventListener( "mouseout", function(){ document.body.style.cursor='default'; } );
 	this.dialogBox.addEventListener( "click",  function(){ setTimeout( clickEvent, 100); });

	this.textContent.addEventListener( "mouseover", function(){ document.body.style.cursor='pointer'; } );
 	this.textContent.addEventListener( "mouseout", function(){ document.body.style.cursor='default'; } );
 	this.textContent.addEventListener( "click", function(){ setTimeout( clickEvent, 100); });

 	this.showDialog= function( textSeq ){
 		if( !peopleImg["Me"] ){
 		   	 peopleImg["Me"] = peopleImg[gameState.gender];
 		}

		if( !peopleImg["Spouse"] ){
			if( gameState.gender == "Male" ){
				peopleImg["Spouse"] = peopleImg["Girlfriend"] ;
			}else{
				peopleImg["Spouse"] = peopleImg["Boyfriend"] ;
			}
		}

 		if( textSeq.seq == "custom" ){
 			messages["custom"] = ["Me: " + textSeq.customText ];
 		}

 		if( textSeq.random ){
 			that.showRandomConvo();
 		}

 		that.currDialogueSeq = new DialogueSequence( textSeq.seq );
 		var nextDialogue = that.currDialogueSeq.next();

 		that.textContent.text=nextDialogue[1];
 		that.currentFace.y = 250;
 		that.currentFace = peopleImg[nextDialogue[0]] || that.currentFace;
 		that.autoAdvance = textSeq.autoAdvance;
 		that.dialogMotionQueue = [DIALOG_SHOWING];
 	}

 	this.showRandomConvo = function(){
 		dialogueList = Object.keys(story);

 		// check if there is something going on
 		if( !that.currDialogueSeq.more() ){
 			this.showDialog( story[ dialogueList[ UtilityFunctions.randRange(0, dialogueList.length) ] ] || story["Dad Tells a bad Joke"] );
 		}
 	}

 	gameState.pubsub.subscribe( "ShowDialog", this.showDialog );

 	// negate double setTimeout if clicked
 	var oldTime = new Date().getTime();
 	var delayCounter = 0;
 	var clickEvent = function( timer ){

 		if( !peopleImg["Me"] ){
 		   	 peopleImg["Me"] = peopleImg[gameState.gender];
 		}

 		// if there is more dialogue text, then keep going, otherwise, recede
 		if( that.currDialogueSeq.more() ){
 			var nextDialogue = that.currDialogueSeq.next();

 			that.dialogMotionQueue.push(DIALOG_SHOWING);
 			that.textContent.text=nextDialogue[1];
 			console.log("showing face:" +nextDialogue[0] );

 			// swap out face immediately
 			that.currentFace.y = 250;
 			that.currentFace = peopleImg[nextDialogue[0]] || that.currentFace;
 			that.currentFace.y = 0;
 		}else{
 			// pause and close dialog
 			setTimeout( function(){that.dialogMotionQueue.push(DIALOG_RECEDING)}, 250 );
 		}

 			delayCounter = 0;
			oldTime = new Date().getTime();
 	}

	stage.addChild( this.dialogBox );
	stage.addChild( this.textContent );

	for(var i in peopleImg ){
		peopleImg[i].alpha = 1;
		peopleImg[i].y = 250;
		stage.addChild( peopleImg[i] );
	}

    return {
    	tick: function(){
    		delayCounter = new Date().getTime() - oldTime;

    		if( that.autoAdvance == true && that.dialogBox.y ==435 && delayCounter > ( that.textContent.text.length * MILLIS_PER_CHAR ) ){
    			clickEvent();
    		}

    		if( that.dialogState == DIALOG_RECEDING ){
	    		that.dialogBox.y+=that.dialogSpeed;
	    		that.textContent.y += that.dialogSpeed;
	    		that.currentFace.y += that.dialogSpeed;
	    		//console.log( "Receding" + that.dialogBox.y );
    		}
    		if( that.dialogState == DIALOG_SHOWING ){
    			that.dialogBox.y-=that.dialogSpeed;
    			that.textContent.y -= that.dialogSpeed;
    			that.currentFace.y -= that.dialogSpeed;
    			//console.log( "Advancing" + that.dialogBox.y );
    		}

    		// toggle states
    		if( that.dialogBox.y > 250 && that.dialogState == DIALOG_RECEDING ){
    			that.dialogBox.y = 250;
    			that.textContent.y = 735;
    			that.currentFace.y = 250;
    			that.dialogState = DIALOG_PAUSING;
    			//console.log( "Pausing on recede" + that.dialogBox.y );

    		}
    		if( that.dialogBox.y < 0 && that.dialogState == DIALOG_SHOWING ){
    			that.dialogBox.y = 0;
    			that.textContent.y = 480;
    			that.currentFace.y = 0;
    			that.dialogState = DIALOG_PAUSING;
    			//console.log( "Pausing on showing" + that.dialogBox.y );
    		}

    		/* next states if there are any on the queue */
    		if( that.dialogMotionQueue.length > 0 && that.dialogState == DIALOG_PAUSING ){
    			that.dialogState = that.dialogMotionQueue.shift();
    		}
    	},

    	minDialog: function(){
    		that.dialogMotionQueue.push( DIALOG_RECEDING );
    	},

    	maxDialog: function(){
    		that.dialogMotionQueue.push( DIALOG_SHOWING );
    	},
    	render: function(){
			stage.addChild( that.dialogBox );
			stage.addChild( that.textContent );

			for(var i in peopleImg ){
				peopleImg[i].alpha = 1;
				stage.addChild( peopleImg[i] );
			}
    	}
	}
}