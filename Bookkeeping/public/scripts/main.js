var rhit = rhit || {};



rhit.FB_COLLECTION_TRANSACTION = "Transaction";
rhit.FB_KEY_AMOUNT = "amount";
rhit.FB_KEY_DESCRIPTION = "description";
rhit.FB_KEY_TIME = "time";
rhit.FB_KEY_TYPE = "type";
rhit.FB_KEY_ISINCOME = "isIncome";
rhit.FB_KEY_AUTHOR = "author";
rhit.fbMovieQuotesManager = null;
rhit.fbSingleQuoteManager = null;
rhit.fbAuthManager = null;

let deletedType = "";
let deletedTime = "";
let deletedDescription = "";
let deletedAmount = 0;
let deletedIsIncome = false;
let addBack = false;

const map = new Map();
rhit.incomeAmountMap = new Map();
rhit.expenseAmountMap = new Map();
let isEditing = true;
let dateCreated = [];
let clicked = false;
let flag = false;
let type = "";


function pushToLocal(map) {
	map.forEach((value, key) => {
		console.log("key", key, " value ", value);
		localStorage.setItem(key, value);
		console.log(localStorage);
	})
}

function incomePushToLocal(map) {
	map.forEach((value, key) => {
		console.log("key", key, " value ", value);
		localStorage.setItem("income" + key, value);
	})
}



function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}


function buttonToggle() {
	flag = !flag;
}

function selectType(typeSelected) {
	type = typeSelected;
	document.querySelector("#iconSelected").innerHTML = typeSelected;
	$('#selectType').modal('hide');
}

function selectEditType(typeSelected) {
	document.querySelector("#editType").innerHTML = typeSelected;
	console.log("editType", typeSelected);
	$('#selectEditType').modal('hide');
}

function toDate(timestamp) {
	
	return timestamp.toString().substring(0, 10);
}

rhit.ListPageController = class {
	constructor() {

		document.querySelector("#menuShowAllQuotes").addEventListener("click", (event) => {
			window.location.href = "/piechart.html"
		});

		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});

		if (localStorage.getItem("addBack") == "1"){
			console.log("localStorage.getItem(addBack)", localStorage.getItem("addBack"));
			$('#addBackDialog').modal("show");
			
			localStorage.setItem("addBack", "2")

			document.querySelector("#undoButton").addEventListener("click", (event) => {
				rhit.fbMovieQuotesManager.add(
					localStorage.getItem("deletedAmount"),
					localStorage.getItem("deletedDescription"),
					localStorage.getItem("deletedType"),
					localStorage.getItem("deletedIsIncome"),
					localStorage.getItem("deletedTime"))
				localStorage.setItem("addBack", "2")
			});
			console.log("localStorage.getItem(after)", localStorage.getItem("addBack"));
		}

		document.querySelector("#submitAddEvent").addEventListener("click", (event) => {
			const amount = parseInt(document.querySelector("#inputAmount").value);
			const time = document.querySelector("#time").value;
			const description = document.querySelector("#inputDescription").value;
			const transactionType = type;

			rhit.fbMovieQuotesManager.add(amount, description, transactionType, flag, time);
		});

		$("#addEventDialog").on("show.bs.modal", (event) => {
			document.querySelector("#inputDescription").value = "";
		});

		$("#addEventDialog").on("shown.bs.modal", (event) => {
			console.log("isIncome.value : ", document.querySelector("#inputIsIncome").value);
		
		});
			
		rhit.fbMovieQuotesManager.beginListening(this.updateList.bind(this));
	}

	_createGroup(currentDate, i, income, expense){
		return htmlToElement(`
		<div class="date-card card">
              <div class="card-header" id="heading${i}">
                <h5 class="mb-0">
                  <button class="btn btn-link my-header-font" data-toggle="collapse" data-target="#collapse${i}" aria-controls="collapse${i}">
                    ${currentDate}
                  </button>
				  <span class="amount">${expense}</span>
				  <span class="amount-isIncome-top">${income}</span>
                </h5>
              </div>
          
              <div id="collapse${i}" class="collapse show" aria-labelledby="heading${i}" data-parent="#accordion">
                  <div id="trans-container${i}" class="my-transaction"></div>
              </div>
            </div>`)
	}

	_createCard(movieQuote){
		if(movieQuote.isIncome) {
			return htmlToElement(`<div id="transaction">
			<div class="my-card card">
			  <div class="card-body">
				<div class="single-transaction card-title">
					<span class="material-icons">${movieQuote.type}</span>
					<p class="my-description">${movieQuote.description}</p>
					<span class="amount-isIncome">${movieQuote.amount}</span>
				</div>
			  </div>
			</div>
		  </div>`);
		}
		return htmlToElement(`<div id="transaction">
		<div class="my-card card data-toggle="modal" data-target="#viewEventDialog"">
		  <div class="card-body">
			<div class="single-transaction card-title">
				<span class="material-icons">${movieQuote.type}</span>
				<span class="my-description">${movieQuote.description}</span>
				<span class="amount">${movieQuote.amount}</span>
			</div>
		  </div>
		</div>
	  </div>`);
	}
	//h6 class="card-subtitle mb-2 text-muted">${movieQuote.amount}</h6>

	updateMap() {
		for (let i = 0; i < rhit.fbMovieQuotesManager.length; i++) {
			const mq = rhit.fbMovieQuotesManager.getMovieQuoteAtIndex(i);
			let array = [];
			if (map.get(toDate(mq.time))){
				array = map.get(toDate(mq.time));
			}
			array.push(mq);
			map.set(toDate(mq.time), array);
		}
		
	}

	addToAmountMap(transaction) {
		if(transaction.isIncome){
			if (!rhit.incomeAmountMap.get(transaction.type)) {
				rhit.incomeAmountMap.set(transaction.type, 0);
			} 
			const income = parseInt(rhit.incomeAmountMap.get(transaction.type));
			rhit.incomeAmountMap.set(transaction.type, transaction.amount + income);
		} else{
			if (!rhit.expenseAmountMap.get(transaction.type)) {
				rhit.expenseAmountMap.set(transaction.type, 0);
			}
			const expense = parseInt(rhit.expenseAmountMap.get(transaction.type));
			rhit.expenseAmountMap.set(transaction.type, transaction.amount + 0);
		}

	}

	updateList() {
		if(clicked){
			document.querySelector("listpage").removeChild();
		}
		
		this.updateMap();		
		const newGroupList = htmlToElement(`<div id="group-container" class="container"></div>`);
		let k = 0;
		
		map.forEach((value, key) => {
			let income = 0;
			let expense = 0;
			
			const newList = htmlToElement(`<div id="trans-container${k}"` + ` class="container"></div>`);
			for (let i = 0; i < value.length; i++) {
				const mq = value[i];
				this.addToAmountMap(value[i]);
				if (mq.isIncome) {
					income = income + parseInt(mq.amount);
				} else {
					expense = expense + parseInt(mq.amount);
				}
				const newCard = this._createCard(mq);
				newCard.onclick = (event) => {
					window.location.href = `/transaction.html?id=${mq.id}`;
				}
				newList.appendChild(newCard);
			}

			const newGroup = this._createGroup(key, k, parseInt(income), parseInt(expense));
			newGroupList.appendChild(newGroup);
			const oldGroupList = document.querySelector("#group-container");
			oldGroupList.parentElement.appendChild(newGroupList);
			const oldList = document.querySelector(`#trans-container${k}`);

			oldList.parentElement.appendChild(newList);
			oldList.parentNode.removeChild(oldList);
			k++;
		  });
		  pushToLocal(rhit.expenseAmountMap);
		  incomePushToLocal(rhit.incomeAmountMap);

	}
}

rhit.MovieQuote = class {
	constructor(id, amount, description, type, isIncome, time){
		this.id = id;
		this.amount = amount;
		this.description = description;
		this.type = type;
		this.isIncome = isIncome;
		this.time = time;
	}
}

rhit.FbMovieQuotesManager = class{
	constructor(uid){
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_TRANSACTION);
		this._unsubscribe = null;
	}
	add(amount, description, type, isIncome, time){
		clicked = true;
		if(time){
			this._ref.add({
				[rhit.FB_KEY_AMOUNT]: amount,
				[rhit.FB_KEY_DESCRIPTION]: description,
				[rhit.FB_KEY_TIME]: time,
				[rhit.FB_KEY_TYPE]: type,
				[rhit.FB_KEY_ISINCOME]: isIncome,
				[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
			})
			.then(function(docRef){
				console.log("ID", docRef.id);
			})
			.catch(function(error){
				console.log(error);
			});
		}else{
			
			const year = firebase.firestore.Timestamp.now().toDate().getFullYear();
			let month = firebase.firestore.Timestamp.now().toDate().getMonth()+1;
			if(month<10){
				month = "0" + month;
			}
			let date = firebase.firestore.Timestamp.now().toDate().getDate();
			if(date<10){
				date = "0" + date;
			}
			const timeNow = year+"-"+month+"-"+date;
			this._ref.add({
				[rhit.FB_KEY_AMOUNT]: amount,
				[rhit.FB_KEY_DESCRIPTION]: description,
				[rhit.FB_KEY_TIME]: timeNow,
				[rhit.FB_KEY_TYPE]: type,
				[rhit.FB_KEY_ISINCOME]: isIncome,
				[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
			})
			.then(function(docRef){
				console.log("ID", docRef.id);
			})
			.catch(function(error){
				console.log(error);
			});
		}
	}
	beginListening(changeListener){
		let query = this._ref
		.orderBy(rhit.FB_KEY_TIME, "desc")
		.limit(50);
		if (this._uid){
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}
		this._unsubscribe = query
		.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			
			changeListener();
		});
	}
	stopListening() { this._unsubscribe(); }
	get length() {
		return this._documentSnapshots.length;
	}
	getMovieQuoteAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const transaction = new rhit.MovieQuote(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_AMOUNT),
			docSnapshot.get(rhit.FB_KEY_DESCRIPTION),
			docSnapshot.get(rhit.FB_KEY_TYPE),
			docSnapshot.get(rhit.FB_KEY_ISINCOME),
			docSnapshot.get(rhit.FB_KEY_TIME)
		);
		return transaction;
	}
	update(id, quote, movie) {}
	delete(id) {}
}

rhit.DetailPageController = class {
	constructor() {
		//this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_DELETED_TRANSACTION);
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_TRANSACTION);
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});

		document.querySelector("#menuEdit").addEventListener("click", (event) => {
			if(isEditing){
				document.querySelector("#menuEdit").innerHTML = `<i class="material-icons">save</i>&nbsp;&nbsp;&nbsp;Save`;
				const editCard = htmlToElement(`<div id="detailPage" class="container page-container">`);
				const newCard = this._createEditCard(rhit.fbSingleQuoteManager.type,
					rhit.fbSingleQuoteManager.time,
					rhit.fbSingleQuoteManager.description,
					rhit.fbSingleQuoteManager.amount,
					rhit.fbSingleQuoteManager.isIncome
					);
				//editCard.remove();
				editCard.appendChild(newCard);
				const oldList = document.querySelector("#detailPage");
				oldList.removeAttribute("id");
				oldList.hidden = true;
				oldList.parentElement.appendChild(editCard);
	
				document.querySelector("#editType").innerHTML = rhit.fbSingleQuoteManager.type;
				document.querySelector("#editDate").value = rhit.fbSingleQuoteManager.time;
				document.querySelector("#editDescription").value = rhit.fbSingleQuoteManager.description;
				document.querySelector("#editAmount").value = rhit.fbSingleQuoteManager.amount;
				isEditing = false;
			} else{
				document.querySelector("#menuEdit").innerHTML = `<i class="material-icons">edit</i>&nbsp;&nbsp;&nbsp;Edit`;

				rhit.fbSingleQuoteManager.update(
					document.querySelector("#editType").innerHTML,
					document.querySelector("#editDate").value, 
					document.querySelector("#editDescription").value,
					document.querySelector("#editAmount").value, 
					rhit.fbSingleQuoteManager.isIncome);
				isEditing = true;
			}
			
		});

		document.querySelector("#submitDeleteQuote").addEventListener("click", (event) => {
			deletedType = rhit.fbSingleQuoteManager.type;
			deletedTime = rhit.fbSingleQuoteManager.time;
			deletedDescription = rhit.fbSingleQuoteManager.description;
			deletedAmount = rhit.fbSingleQuoteManager.amount;
			deletedIsIncome = rhit.fbSingleQuoteManager.isIncome;

			localStorage.setItem("addBack", "1");
			localStorage.setItem("deletedAmount", deletedAmount);
			localStorage.setItem("deletedType", deletedType);
			localStorage.setItem("deletedTime", deletedTime);
			localStorage.setItem("deletedDescription", deletedDescription);
			localStorage.setItem("deletedIsIncome", deletedIsIncome);

			rhit.fbSingleQuoteManager.delete().then(() =>{
				
				window.location.href = "/";
				
			})
			.catch(function(error){
				console.log(error);
			});;
		});

		rhit.fbSingleQuoteManager.beginListening(this.updateView.bind(this));
	}

	beginListening(changeListener){
		let query = this._ref
		.orderBy(rhit.FB_KEY_TIME, "desc")
		.limit(50);
		if (this._uid){
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}
		this._unsubscribe = query
		.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
		
			changeListener();
		});
	}
	get length() {
		return this._documentSnapshots.length;
	}
	
	stopListening() { this._unsubscribe(); }

	add(amount, description, type, isIncome, time){
			this._ref.add({
				[rhit.FB_KEY_AMOUNT]: amount,
				[rhit.FB_KEY_DESCRIPTION]: description,
				[rhit.FB_KEY_TIME]: time,
				[rhit.FB_KEY_TYPE]: type,
				[rhit.FB_KEY_ISINCOME]: isIncome,
				[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
			})
			.then(function(docRef){
				console.log("ID", docRef.id);
			})
			.catch(function(error){
				console.log(error);
			});
		}

	_createEditCard(type, time, description, amount, isIncome) {
		if(isIncome){
		return htmlToElement(`    
		<div class="card">
		<div class="card-body">
		  <h5 id="editType" class="card-title material-icons"></h5>
		<button class="selectTypeButton" type="button" class="btn" id="editType" data-toggle="modal" data-target="#selectEditType">select</button>
			<hr><hr>
			<label for="editDate">Date: &nbsp;&nbsp;&nbsp;&nbsp;</label>
			<input id="editDate" class="edit-subtitle mb-2 text-muted"></input>
		<hr><hr>
			<label for="editDescription">Description: &nbsp;&nbsp;&nbsp;&nbsp;</label>
			  <input id="editDescription" class="edit-subtitle mb-2 text-muted"></input>
		<hr><hr>
			<label for="editAmount">Amount: &nbsp;&nbsp;&nbsp;&nbsp;$</label>
			<input id="editAmount" class="edit-subtitle mb-2 text-muted green"></input>
		</div>
	  </div>
  		`)}
		else
		{
			return htmlToElement(`    
		<div class="card">
		<div class="card-body">
		  <h5 id="editType" class="card-title material-icons"></h5>
		  <button class="selectTypeButton" type="button" class="btn" id="editType" data-toggle="modal" data-target="#selectEditType">select</button>
			<hr><hr>
			<label for="editDate">Date: &nbsp;&nbsp;&nbsp;&nbsp;</label>
			<input id="editDate" class="edit-subtitle mb-2 text-muted"></input>
		<hr><hr>
			<label for="editDescription">Description: &nbsp;&nbsp;&nbsp;&nbsp;</label>
			  <input id="editDescription" class="edit-subtitle mb-2 text-muted"></input>
		<hr><hr>
			<label for="editAmount">Amount: &nbsp;&nbsp;&nbsp;&nbsp;$</label>
			<input id="editAmount" class="edit-subtitle mb-2 text-muted red"></input>
		</div>
	  </div>
  		`)

		}
	}


	_createCard(type, time, description, amount, isIncome) {
		if(isIncome){
		return htmlToElement(`    
		<div id="detail-card" class="card">
		<div class="card-body">
		  <h5 id="cardType" class="card-title material-icons">${type}</h5>
			<hr><hr>
			<label for="cardDate">Date: &nbsp;&nbsp;&nbsp;&nbsp;</label>
			<span id="cardDate" class="card-subtitle mb-2 text-muted">${time}</span>
		<hr><hr>
			<label for="cardDescription">Description: &nbsp;&nbsp;&nbsp;&nbsp;</label>
			  <h7 id="cardDescription" class="card-subtitle mb-2 text-muted">${description}</h7>
		<hr><hr>
			<label for="cardAmount">Amount: &nbsp;&nbsp;&nbsp;&nbsp;$</label>
			<h8 id="cardAmount" class="card-subtitle mb-2 text-muted green">${amount}</h8>
		</div>
	  </div>
  		`)}
		else
		{
			return htmlToElement(`    
		<div id="detail-card" class="card">
		<div class="card-body">
		  <h5 id="cardType" class="card-title material-icons">${type}</h5>
			<hr><hr>
			<label for="cardDate">Date: &nbsp;&nbsp;&nbsp;&nbsp;</label>
			<span id="cardDate" class="card-subtitle mb-2 text-muted">${time}</span>
		<hr><hr>
			<label for="cardDescription">Description: &nbsp;&nbsp;&nbsp;&nbsp;</label>
			  <h7 id="cardDescription" class="card-subtitle mb-2 text-muted">${description}</h7>
		<hr><hr>
			<label for="cardAmount">Amount: &nbsp;&nbsp;&nbsp;&nbsp;$</label>
			<h8 id="cardAmount" class="card-subtitle mb-2 text-muted red">${amount}</h8>
		</div>
	  </div>
  		`)

		}
	}
	updateView() {
		//TODO
		//TODO
		const detailCard = htmlToElement(`<div id="detailPage" class="container page-container">`);
		const newCard = this._createCard(rhit.fbSingleQuoteManager.type,
			rhit.fbSingleQuoteManager.time,
			rhit.fbSingleQuoteManager.description,
			rhit.fbSingleQuoteManager.amount,
			rhit.fbSingleQuoteManager.isIncome
			);
		detailCard.appendChild(newCard);
		const oldList = document.querySelector("#detailPage");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		// Put in the new quoteListContainer
		oldList.parentElement.appendChild(detailCard);


		// document.querySelector("#cardType").innerHTML = rhit.fbSingleQuoteManager.type;
		// document.querySelector("#cardDate").innerHTML = rhit.fbSingleQuoteManager.time;
		// document.querySelector("#cardDescription").innerHTML = rhit.fbSingleQuoteManager.description;
		// document.querySelector("#cardAmount").innerHTML = rhit.fbSingleQuoteManager.amount;

			document.querySelector("#menuEdit").style.display = "flex";
			document.querySelector("#menuDelete").style.display = "flex";
	}
}

rhit.FbSingleQuoteManager = class {
	constructor(movieQuoteId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_TRANSACTION).doc(movieQuoteId);
	}
	beginListening(changeListener){
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if(doc.exists){
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			}else{
				console.log("no such document");
				//window.location.href = "/";
			}
		});
	}

	stopListening(){
		this._unsubscribe();
	}
	update(type, time, description, amount, isIncome) {
		this._ref.update({
			[rhit.FB_KEY_AMOUNT]: amount,
			[rhit.FB_KEY_DESCRIPTION]: description,
			[rhit.FB_KEY_TIME]: time,
			[rhit.FB_KEY_TYPE]: type,
			[rhit.FB_KEY_ISINCOME]: isIncome,
		})
		.then(() =>{
			console.log("Updated");
		})
		.catch(function(error){
			console.log(error);
		});
	}
	delete() {
		return this._ref.delete();
	}

	get transaction() {
		return this._documentSnapshot.get(rhit.FB_KEY_TRANSACTION);
	}

	get amount() {
		return this._documentSnapshot.get(rhit.FB_KEY_AMOUNT);
	}

	get description() {
		return this._documentSnapshot.get(rhit.FB_KEY_DESCRIPTION);
	}

	get type() {
		return this._documentSnapshot.get(rhit.FB_KEY_TYPE);
	}

	get isIncome() {
		return this._documentSnapshot.get(rhit.FB_KEY_ISINCOME);
	}

	get author() {
		return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
	}

	get time() {
		return this._documentSnapshot.get(rhit.FB_KEY_TIME);
	}
}

rhit.storage = rhit.storage || {};
rhit.storage.MOVIEQUOTE_ID_KEY = "movieQuoteId";
rhit.storage.getMovieQuoteId = function() {
	const mqId = sessionStorage.getItem(rhit.storage.MOVIEQUOTE_ID_KEY);
	if(!mqId){
		console.log("Mo movie quote id in sessionStorage");
	}
	return mqId;
};

rhit.storage.setMovieQuoteId = function(movieQuoteId) {
	sessionStorage.setItem(rhit.storage.MOVIEQUOTE_ID_KEY, movieQuoteId);
};

rhit.LoginPageController = class {
	constructor() {

	}
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
		console.log("you have made the Auth Manager");
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}

	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("Sign Out error");
		});
	}
	get isSignedIn() {
		return !!this._user; 
		//return this._user != null;
	}
	get uid() {
		return this._user.uid;
	}
}

rhit.checkForRedirects = function() {
	if(document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn){
		window.location.href = "/list.html";
	}
	if(!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn){
		window.location.href = "/";
	}
}

rhit.initializePage = function() {
	const urlParams = new URLSearchParams(window.location.search);
	if(document.querySelector("#listPage")){
		const uid = urlParams.get("uid");
		console.log("got url param = ", uid);
		rhit.fbMovieQuotesManager = new rhit.FbMovieQuotesManager(uid);
		new rhit.ListPageController();
	}

	if(document.querySelector("#detailPage")){
		console.log("detail");
		const movieQuoteId = urlParams.get("id");
		if(!movieQuoteId){
			console.log("Missing movie quote id!");
			window.location.href = "/";
		}
		rhit.fbSingleQuoteManager = new rhit.FbSingleQuoteManager(movieQuoteId);
		new rhit.DetailPageController();
	}

	if(document.querySelector("#piechartPage")){
		google.charts.load("current", {packages:["corechart"]});
    	google.charts.setOnLoadCallback(drawChart);
		drawChart();
	}
	if(document.querySelector("#loginPage")){
		new rhit.LoginPageController();
	}
}

// google.charts.load("current", {packages:["corechart"]});
//       google.charts.setOnLoadCallback(drawChart);
function drawChart() {
	let traveling = parseInt(localStorage.getItem("airport_shuttle"));
	let tuition = parseInt(localStorage.getItem("school"));
	let healthCare = parseInt(localStorage.getItem("medical_services"));
	let dinning = parseInt(localStorage.getItem("restaurant"));
	let shopping = parseInt(localStorage.getItem("shopping_cart"));
	let rent = parseInt(localStorage.getItem("holiday_village"));
	console.log(traveling);
	console.log(tuition);
	console.log(healthCare);
	console.log(dinning);
	console.log(shopping);
	console.log(rent);
        var data = google.visualization.arrayToDataTable([
		  ['Type', 'Amount'],
          ["Traveling", traveling],
		  ["Tuition", tuition],
		  ["Health Care", healthCare],
		  ["Dinning", dinning],
		  ["Shopping", shopping],
		  ["Rent", rent]]
        );

        var options = {
          title: 'Expenditure',
          is3D: true,
        };

        var chart = new google.visualization.PieChart(document.getElementById('piechart_3d'));
        chart.draw(data, options);

		tuition = parseInt(localStorage.getItem("school"));
		data = google.visualization.arrayToDataTable([
			  ['Type', 'Amount'],
			  ["Tuition", tuition]]
			);
	
			var options = {
			  title: 'Income',
			  is3D: true,
			};
	
		var chart = new google.visualization.PieChart(document.getElementById('piechart_3d_income'));
		chart.draw(data, options);
	}
/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		rhit.checkForRedirects();
		rhit.initializePage();
	});

	firebase.auth().onAuthStateChanged((user) => {
		if (user){
			const displayName = user.displayName;
			const email = user.email;
			const photoURL = user.photoURL;
			const phoneNumber = user.phoneNumber;
			const isAnonymous = user.isAnonymous;
			const uid = user.uid;
			console.log("The user is signed in", uid);
			console.log('displayName :>> ', displayName);
			console.log('email :>> ', email);
			console.log('photoURL :>> ', photoURL);
			console.log('phoneNumber :>> ', phoneNumber);
			console.log('isAnonymous :>> ', isAnonymous);
			console.log('uid :>> ', uid);
		}else{
			console.log("There is no user signed in!");
		}
	});



	// document.querySelector("#anonymousAuthButton").onclick = (event) => {
		
	// 	firebase.auth().signInAnonymously().catch(function (error){
	// 		var errorCode = error.code;
	// 		var errorMessage = error.message;
	// 		console.log("Anonymous auth error", errorCode, errorMessage);
	// 	});
	// };

	rhit.startFirebaseUI();
};

rhit.startFirebaseUI = function() {
	var uiConfig = {
		signInSuccessUrl: '/',
		signInOptions: [
		firebase.auth.GoogleAuthProvider.PROVIDER_ID,
		firebase.auth.EmailAuthProvider.PROVIDER_ID,
		firebase.auth.PhoneAuthProvider.PROVIDER_ID,
		firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
		],

	};
	const ui = new firebaseui.auth.AuthUI(firebase.auth());
	ui.start('#firebaseui-auth-container', uiConfig);

}


rhit.main();
