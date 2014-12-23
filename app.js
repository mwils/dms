Array.prototype.removeDuplicates = 
function () {
  for (var i = 0; i < this.length; ) {
    if (this[i] === this[i+1]) {
      this.splice(i, 1);
    } else {
      i++
    }
  }
}

$.cloudinary.config({cloud_name: 'wormsetc'});

var Dms = Ember.Application.create({
  LOG_TRANSITIONS: true,
  LOG_ACTIVE_GENERATION: true,
});

Dms.dealerConfig = ({
  tagline: "Welcome to Doc Wilson\'s cars. Your Jeep specialist.",
  cldPreset: 'docwilsonwi2jnyzb',
  siteName: "Doc Wilson\'s Cars",
  firebase: "https://dmsapi.firebaseio.com/"
});

Dms.ApplicationAdapter = DS.FirebaseAdapter.extend({
  firebase: new Firebase(Dms.dealerConfig.firebase)
});


Dms.Router.map(function (){
    this.resource('photo');
    this.resource('inventory');
    this.resource('vehicle', {path: '/inventory/vehicle/:car_id'}, function() {
      this.resource('sell');
    });
    this.resource('soldSheet');
    this.resource('soldVehicle', {path: '/soldSheet/vehicle/:car_id'});
});
/*
Dms.IndexController = Ember.Controller.extend({
  siteName: Dms.dealerConfig.siteName,
  siteTitle: 'DMS',
  tagline: Dms.dealerConfig.tagline
});
*/
Dms.EditsController = Ember.ObjectController.extend({
  isEditing: false,
  didInsertElement: function() {
    this.$().focus();
  },
  actions: {
    edit: function() {
      console.log('edit');
      this.set('isEditing', true);
    },
    acceptEdit: function() {
      this.set('isEditing', false);
      this.get('model').save();
    }
  }
});


Dms.DescriptionAreaComponent = Ember.TextArea.extend({
  sendChange: 'acceptChanges',
  becomeFocused: function() {
    this.$().focus();
  }.on('didInsertElement'),
  accept: function() {
    this.sendAction("sendChange");
  }.on('focusOut'),
});

Dms.AddrInputComponent = Ember.TextField.extend({
  saveChange: 'saveAddress',
  becomeFocused: function() {
    this.$().focus();
  }.on('didInsertElement'),
  accept: function() {
    console.log('send');
    this.sendAction("saveChange");
  }.on('focusOut'),
  insertNewline: function() {
    this.sendAction("saveChange");
  }
});

Dms.ValueInputComponent = Ember.TextField.extend({
  sendChange: 'acceptChanges',
  becomeFocused: function() {
    this.$().focus();
  }.on('didInsertElement'),
  accept: function() {
    console.log('send');
    this.sendAction("sendChange");
  }.on('focusOut'),
  insertNewline: function() {
    this.sendAction("sendChange");
  }
});

Dms.AddrAreaComponent = Ember.TextArea.extend({
  sendChange: 'acceptChanges',
  becomeFocused: function() {
    this.$().focus();
  }.on('didInsertElement'),
  accept: function() {
    console.log('send');
    this.sendAction("sendChange");
  }.on('focusOut'),
  insertNewline: function() {
    this.sendAction("sendChange");
  }
});

Dms.CloudinaryView = Ember.View.extend({
  tagName: 'input',
  name: 'file',
  classNames: ['cloudinary-fileupload'],
  attributeBindings: ['name', 'type', 'data-form-data'],
  type: 'file',

  didInsertElement: function() {
    var controller = this.get('controller');

    this.$().unsigned_cloudinary_upload(
      Dms.dealerConfig.cldPreset, {
        cloud_name: 'wormsetc'
      }, {
        disableImageResize: false,
        imageMaxWidth: 1000,
        imageMaxHeight: 1000,
        acceptFileTypes: /(\.|\/)(gif|jpe?g|png|bmp|ico)$/i,
        maxFileSize: 5000000 // 5MB
      }
    );
    
    this.$().bind("fileuploadstart", function(e){
      controller.set('uploading', true);
    });
    
    this.$().bind("fileuploadstop", function(e){
      controller.set('uploading', false);
    });
    
    this.$().bind('fileuploaddone', function (e, data) {
      
      controller.set('cloudinaryPublicId', data.result.public_id);
      controller.send('createPhoto');
    });
  }
  
  
});

Dms.PhotoController = Ember.ArrayController.extend({
  name: '',
  uploading: false,
  actions: {
    createPhoto: function() {
      var self = this;
      newPhoto = this.store.createRecord('photo', {
        name: this.get('make') + ' ' + this.get('model'),
        cloudinaryPublicId: this.get('cloudinaryPublicId')
      });
      newPhoto.save();
      
    }
  }
});


/******************************************************************************
//                     Vehicle Controller
//
******************************************************************************/

Dms.editing = false;		// Provides closure for editing variable in edit and acceptChanges functions

Dms.VehicleController = Ember.ObjectController.extend({
  selling: false, rate: 6, duration: 36, amount: 0,
  daysAging: function() {
    pDate = this.get('purchaseDate');
    return moment(pDate, "YYYY-MM-DD").fromNow(true);
  }.property('purchaseDate'),
  cost: function() {						// Totals cost of car including expenses 
    return this.get('paid') + this.get('expenses');
  }.property('expenses', 'paid'),
  expensePurchaseDate: function() {
    return moment().format('YYYY-MM-DD');
  }.property(),
  actions: {
    sell: function() {
      this.set('selling', true);
      this.transitionTo('sell', this.get('id'));
    },
    cancelSale: function() {
      this.set('selling', false);
      this.transitionTo('vehicle', this.get('id'));
    },
    calcPayments: function() {
      var princ = this.get('asking');
      var term  = this.get('duration');
      var intr   = this.get('rate') / 1200;
      this.set('payments', Math.round(princ * intr / (1 - (Math.pow(1/(1 + intr), term)))));
    },
    edit: function(param) {
      if(Dms.editing) {
        this.set('isEditing'+editing, false);
      }
      Dms.editing = param;
      editing = Dms.editing;						// Hack to prevent from having to write function for eack input
      if(this.get('isEditing'+editing)) {				// Input cannot handle a parameter and needed someway to pass which in
        this.set('isEditing'+editing, false);
      } else {
        this.set('isEditing'+param, true);
        $(param).focus();
      }
    },
    acceptChanges: function(param) {
      this.get('model').save();
      this.set('isEditing'+Dms.editing, false);
      Dms.editing = false;
      console.log('accept' + param);
    },
    removeCar: function() {
      var r = confirm('This will remove this vehicle from inventory and cannot be undone.');
      if (r) {
      this.get('model').destroyRecord();
      }
    },
    removeExpense: function(expense) {
      var self = this;
      var r = confirm('This will remove this expense item and cannot be undone.');
      if (r) {
        expense.destroyRecord().then(function() {
          self.get('model').save();
          console.log('saved');
        });
      }
    },
    saveExpense: function() {
      var n = this.get('amount');
      if(isNaN(parseInt(n))) {
        n=0;
      }
      var expense = this.store.createRecord('expense', {
        car: this.get('model'),
        itemName: this.get('itemName'),
        amount: n,
        expensePurchaseDate: this.get('expensePurchaseDate'),
        vendor: this.get('vendor')
      });
      var controller = this;
      expense.save().then(function() {
        console.log('save');
        controller.get('model').save();
        /*controller.set('itemName', '').set('amount', '')
        .set('vendor', '');*/
      });
    },
    createPhoto: function() {
      var self = this;
      newPhoto = this.store.createRecord('photo', {
        car: this.get('model'),
        name: this.get('make') + ' ' + this.get('vModel'),
        cloudinaryPublicId: this.get('cloudinaryPublicId')
      });
      newPhoto.save().then(function() {
        self.get('model').save();
      });
    },
    removePhoto: function(photo) {
      var self = this;
      var r = confirm('Are you sure you want to remove this photo?');
      if (r) {
        //$.cloudinary.api.delete_resources(['image1'],
        //function(result){});
        photo.destroyRecord().then(function() {
          self.get('model').save();
        });
      }
    },
    saveAddress: function() {
      this.send('edit');
      this.get('model').save();
    }
  }
}); 

Dms.veh = {};

/******************************************************************************
//                     Inventory Controller
//
******************************************************************************/

Dms.InventoryController = Ember.ArrayController.extend({
  unsoldCar: function() {
    return this.get('arrangedContent').filterProperty('isSold', false);
  }.property('content.@each', 'content.@each.isSold', 'sortProperties'),
  sortProperties: ['keyNumber'],
  carsCount: Ember.computed.alias('unsoldCar.length'),
  purchaseDate: function() {
    return moment().format('YYYY-MM-DD');
  }.property(),
  vin: '', make: '', vModel: '', style: '',
  retail:'', trade:'',year: '',
  color: '', miles: '', engine: '', asking: '',
  trans: '', desc: '', drive: '', stock: '',
  //soldCars: 
  vinSubmit: function() {
    var vinNum = this.get('vin');
    if(vinNum.length > 16) {
      this.send('vinDecode');
    }
  }.property('vin'),
  keyNumber: function() {
    console.log('keynumber');
    var allKeys = this.store.all('car');
    var keysArray = allKeys.mapBy('keyNumber');
    keysArray.push(0);
    keysArray.sort(function(a, b){return a-b});
    keysArray.removeDuplicates();
    for(var i=0; i<keysArray.length+1; i++) {
      if(i == keysArray[i]) {
      } else {
        return i;
      }
    }
  }.property('carsCount', 'keyNumber.@each'),
  

  actions: {
    sortBy: function(property) {
      this.set('sortProperties', [property]);
      this.set('sortAscending', !this.get('sortAscending'));
    },
    saveError: function(error) {
      alert('Warning, there was an error when adding vehicle to database.');
      console.log(error);
    },
    setFields: function() {
      console.log('fields set');
      var veh = Dms.veh;
      var vinNum = this.get('vin');
      var trans = veh.transmission;
      price = veh.price;
      style = veh.years[0].styles[0];
      this.set('stock', vinNum.substring(13, 17))
        .set('make', veh.make.name).set('vModel', veh.model.name)
        .set('year', veh.years[0].year).set('drive', veh.drivenWheels);
      if(price && price.usedTmvRetail && price.usedTradeIn) {
        this.set('retail', price.usedTmvRetail).set('trade', price.usedTradeIn);
      };
      if(Array.isArray(veh.years)) {
        this.set('style', style.name);
      };
      if(trans && trans.transmissionType) {
        this.set('trans', trans.transmissionType);
        if(trans.numberOfSpeeds) {
          this.set('trans', this.get('trans') + ' ' + trans.numberOfSpeeds + ' speed');
        }
      }
      if(veh.engine && veh.engine.configuration){this.set('style', this.get('style') + ' ' + veh.engine.configuration)};
      if(veh.engine && veh.engine.cylinder){this.set('style', this.get('style') + ' ' + veh.engine.cylinder)};
      if(veh.engine && veh.engine.size){this.set('style', this.get('style') + ' ' + veh.engine.size)};
    },
    clearVin: function(){this.set('vin', '');},
    clearFields: function() {
      console.log('clearFields');
      this.set('make', '').set('vModel', '')
      .set('year', '').set('color', '').set('engine', '').set('trans', '').set('retail', '').set('trade', '')
      .set('drive', '').set('paid', '').set('style', '').set('miles', '').set('stock', '').set('asking', '')
      .set('fromName', '').set('fromAddr', '').set('fromCity', '').set('fromZipcode', '').set('fromState', '')
      .set('fromPhone', '')
    },
    addInventory: function() {
      var vehicle = this.store.createRecord('car', {
        vin: this.get('vin').toUpperCase(),
        keyNumber: this.get('keyNumber'),
        stock: this.get('stock'),
        make: this.get('make'),
        vModel: this.get('vModel'), 
        year: this.get('year'),
        style: this.get('style'),
        color: this.get('color'),
        miles: this.get('miles'),
        engine: this.get('engine'),
        trans: this.get('trans'),
        drive: this.get('drive'),
        paid: this.get('paid'),
        asking: this.get('asking'),
        retail: this.get('retail'),
        trade: this.get('trade'),
        purchaseDate: this.get('purchaseDate'),
        fromName: this.get('fromName'),
        fromAddr: this.get('fromAddr'),
        fromCity: this.get('fromCity'),
        fromZipcode: this.get('fromZipcode'),
        fromState: this.get('fromState'),
        fromPhone: this.get('fromPhone'),
        addedOn: new Date()
      });

      var controller = this;
      //vehicle.get('expense').pushObject(expense); 		//have to 'get' the model to push object to it
      vehicle.save()
      //expense.save()
      .then(function(param) {
        controller.send('clearFields');
        controller.send('clearVin');
      });
      /*vehicle.save().then(function(param) {
        //expense.set('id', 1234);
        //expense.save();
        //console.log(param.id + this);
        //controller.send('clearFields');
        //controller.send('clearVin');
      //});
      */
    },
    vinDecode: function() {
      var self = this;
      this.send('clearFields');
      $.ajax('https://api.edmunds.com/api/vehicle/v2/vins/' + this.get('vin') + '?fmt=json&api_key=6489fd3vxqymw95f59c62q5h',{
        success: function(result) {
          Dms.veh = {};
          Dms.veh = result;
          self.send('setFields');
        },
        error: function() {
          alert('There was a problem decoding the VIN number. Please check the VIN and try again or enter the vehicle details manually.');
        }
      });
    },
    linkToCar: function(param) {
      this.transitionTo('vehicle', param.id);
    }
  }
});

/******************************************************************************
//                     Sell Controller
//
******************************************************************************/

Dms.SellController = Ember.ObjectController.extend({
  needs: ['vehicle'],
  buyersName: '',
  buyersAddr: '',
  buyersCity: '',
  buyersState: '',
  buyersZipcode: '',
  buyersPhone: '',
  buyersEmail: '',
  saleAmount: function() {
    return this.get('asking');
  }.property(),
  fees: 0,
  liens: 'NONE',
  checkWarning: function() {
    var excess = this.get('excess');
    var inaccurate = this.get('inaccurate');
    if (excess && inaccurate) {
      return true;
    } else {
      console.log('false');
      return false;
    }
    //console.log(excess + ' ' + inaccurate);
  }.property('excess', 'inaccurate'),
  salesTax: function() {
    var price = this.get('saleAmount');
    var tax = (price * 5) / 100;
    if (tax >= 300) {
      return 300;
    } else { 
      return tax;
    }
  }.property('saleAmount'),
  exemptSet: function() {
    var exempt = this.get('exempt');
    if(exempt) {
      this.set('miles', 'EXEMPT');
    } else {
      this.get('model').rollback();
    }
    console.log('true**');
  }.property('exempt'),
  dateSold:function() {
    return moment().format('YYYY-MM-DD');
  }.property(),
  grandTotal: function() {
    var price = parseInt(this.get('saleAmount'), 10);
    if (!price) {
      return 'Please enter sale amount';
    } else {
      var fees = parseInt(this.get('fees'), 10);
      fees = (fees) ? fees : 0;
      var tax = parseInt(this.get('salesTax'), 10);
      tax = (tax) ? tax : 0;
      return price + tax + fees;
    }
  }.property('saleAmount', 'salesTax', 'fees'),
  actions: {
    finalizeSale: function() {
      var self = this;
      self.get('model')
      .set('isSold', true)
      .set('keyNumber', null)
      .set('dateSold', this.get('dateSold'))
      .set('saleAmount', this.get('asking'))
      .set('salesTax', this.get('salesTax'))
      .set('fees', this.get('fees'))
      .set('liens', this.get('liens'))
      .set('buyersName', this.get('buyersName'))
      .set('buyersAddr', this.get('buyersAddr'))
      .set('buyersCity', this.get('buyerscity'))
      .set('buyersState', this.get('buyersState'))
      .set('buyersZipcode', this.get('buyersZipcode'))
      .set('buyersPhone', this.get('buyersPhone'))
      .set('buyersEmail', this.get('buyersEmail'))
      .set('excess', this.get('excess'))
      .set('inaccurate', this.get('inaccurate'))
      .set('milage', this.get('miles'));
        self.get('model').save().then(function() {
          self.transitionTo('soldVehicle', self.get('id'));
        });
      
    }
  }  
});

/******************************************************************************
//                     Sold Sheet Controller
//
******************************************************************************/
Dms.SoldSheetController = Ember.ObjectController.extend({
  soldCar: function() {
    console.log('sold');
    return this.get('content').filterProperty('isSold', true);
  }.property('content.@each', 'content.@each.isSold'),
  actions: {
    linkToCar: function(param) {
      this.transitionTo('soldVehicle', param.id);
    }
  }
});

/******************************************************************************
//                     Sold Vehicle Controller
//
******************************************************************************/
Dms.SoldVehicleController = Ember.ObjectController.extend({
  
  /*niceDate: function() {
    return moment(this.get('purchaseDate')).format('MM-DD-YYYY');
  }.property('purchaseDate'),*/
  roi: function() {
    var self = this;
    var profit = parseInt(this.get('profit'), 10);
    var investment = parseInt(this.get('totalInvestment'), 10);
    var duration = parseInt(this.get('daysOnLot'), 10)/365;
    return Math.round(profit*100/(investment*duration));
  }.property('paid', 'totalInvestment', 'daysOnLot'),
  actions: {
    edit: function(param) {
      var r = true;
      if(!Dms.editing) {
        r = confirm('This vehicle is marked as sold. Are you sure you wish to edit this vehicle\'s record?');
      }
      if (r) {
        if(Dms.editing) {
          this.set('isEditing'+editing, false);
        }
        Dms.editing = param;
        editing = Dms.editing;						// Hack to prevent from having to write function for eack input
        if(this.get('isEditing'+editing)) {				// Input cannot handle a parameter and needed someway to pass which in
          this.set('isEditing'+editing, false);
        } else {
          this.set('isEditing'+param, true);
          $(param).focus();
        }
      }
    },
    acceptChanges: function(param) {
      this.model.save();
      this.set('isEditing'+Dms.editing, false);
      Dms.editing = false;
      console.log('accept' + param);
    },
    removeExpense: function(expense) {
      var self = this;
      var r = confirm('This will remove this expense item and cannot be undone.');
      if (r) {
        expense.destroyRecord().then(function() {
          self.get('model').save();
          console.log('saved');
        });
      }
    },
    saveExpense: function() {
      var n = this.get('amount');
      if(isNaN(parseInt(n))) {
        n=0;
      }
      //if(this.get('amount') ===) { console.log('empty');}
      var expense = this.store.createRecord('expense', {
        car: this.get('model'),
        itemName: this.get('itemName'),
        amount: n,
        expensePurchaseDate: this.get('expensePurchaseDate'),
        vendor: this.get('vendor')
      });
      var controller = this;
      expense.save().then(function() {
        controller.get('model').save();
        controller.set('itemName', '').set('amount', '')
        .set('vendor', '');
      });
    },
    saveAddress: function() {
      this.send('edit');
      this.get('model').save();
    }
  }
});
    
/******************************************************************************
//                     Expenses Controller
//
******************************************************************************/
Dms.ExpensesController = Ember.ObjectController.extend({



});
/******************************************************************************
//                     Routes
//
******************************************************************************/

Dms.InventoryRoute = Ember.Route.extend({
  model: function() {
    var cars = this.store.find('car');
    return cars;
  }
});

Dms.SoldSheetRoute = Ember.Route.extend({
  model: function() {
    var cars = this.store.find('car');
    return cars;
  }
});

Dms.VehicleRoute = Ember.Route.extend({
  model: function(param) {
    return this.store.find('car', param.car_id);
  }
});

Dms.SoldVehicleRoute = Ember.Route.extend({
  model: function(param) {
    return this.store.find('car', param.car_id);
  }
});

Dms.PhotoRoute = Ember.Route.extend({
  model: function() {
    var photos = this.store.find('photo');
    return photos;
  }
});

Dms.SettingsRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('settings');
  }
});

/******************************************************************************
//                     Models
//
******************************************************************************/

Dms.Car = DS.Model.extend({
  vin: DS.attr('string'),
  stock: DS.attr('string'),
  keyNumber: DS.attr('number'),
  make: DS.attr('string'),
  vModel: DS.attr('string'),
  year: DS.attr('number'),
  color: DS.attr('string'),
  style: DS.attr('string'),
  miles: DS.attr('number'),
  engine: DS.attr('string'),
  trans: DS.attr('string'),
  drive: DS.attr('string'),
  addedOn: DS.attr('string'),
  retail: DS.attr('number'),
  trade: DS.attr('number'),
  paid: DS.attr('number'),
  asking: DS.attr('number'),
  carfaxURL: DS.attr('string'),
  description: DS.attr('string'),
  purchaseDate: DS.attr('string'),
  niceDate: function() {
    return moment(this.get('purchaseDate')).format('MM-DD-YYYY');
  }.property('purchaseDate'),
  fromName: DS.attr('string'),
  fromAddr: DS.attr('string'),
  fromZipcode: DS.attr('string'),
  fromState: DS.attr('string'),
  fromPhone: DS.attr('string'),
  fromCity: DS.attr('string'),
  fromOther: DS.attr('string'),
  isSold: DS.attr('boolean', {defaultValue: false}),
  dateSold: DS.attr('string'),
  niceDateSold: function() {
    return moment(this.get('dateSold')).format('MM-DD-YYYY');
  }.property('dateSold'),
  saleAmount: DS.attr('number'),
  salesTax: DS.attr('number'),
  buyersName: DS.attr('string'),
  buyersAddr: DS.attr('string'),
  buyersCity: DS.attr('string'),
  buyersState: DS.attr('string'),
  buyersZipcode: DS.attr('string'),
  buyersPhone: DS.attr('string'),
  buyersEmail: DS.attr('string'),
  liens: DS.attr('string'),
  fees: DS.attr('number'),
  statement: DS.attr('string'),
  milage: DS.attr('string'),
  excess: DS.attr('boolean', {defaultValue: false}),
  exempt: DS.attr('boolean', {defaultValue: false}),
  inaccurate: DS.attr('boolean', {defaultValue: false}),
  daysOnLot: function() {
    var purchased = moment(this.get('purchaseDate'));
    var sold = moment(this.get('dateSold'));
    return sold.diff(purchased, 'days');
  }.property('dateSold'),
  expense: DS.hasMany('expense', { async: true}),
  expenseTotal: function() {
    var exp = this.get('expense');
    var tot = 0;
    exp.forEach(function(exp) {
      tot += parseInt(exp.get('amount'), 10);
    });
    return tot;
  }.property('expense.@each.amount'),
  totalInvestment: function() {
    return parseInt(this.get('paid'), 10) + this.get('expenseTotal');
  }.property('paid', 'expenseTotal'),
  profit: function() {
    return parseInt(this.get('asking'), 10) - this.get('totalInvestment');
  }.property('asking', 'totalInvestment'),
  photo: DS.hasMany('photo', { async: true}),
});


Dms.Expense = DS.Model.extend({
  car: DS.belongsTo('car', { async: true }),
  itemName: DS.attr('string'),
  amount: DS.attr('number'),
  expensePurchaseDate: DS.attr('string'),
  expensePurchaseNiceDate: function() {
    return moment(this.get('expensePurchaseDate')).format('MM-DD-YYYY');
  }.property('expensePurchaseDate'),
  vendor: DS.attr('string')
});

Dms.Photo =  DS.Model.extend({
  car: DS.belongsTo('car', { async: true }),
  name: DS.attr('string'),
  cloudinaryPublicId: DS.attr('string'),
  photoUrl: function() {
    return "http://res.cloudinary.com/wormsetc/image/upload/c_scale,w_200/v1418878423/" + this.get('cloudinaryPublicId');
  }.property('cloudinaryPublicId')
});

Dms.Settings = DS.Model.extend({
  companyName: DS.attr('string'),
  tagline: DS.attr('string'),
  aboutUs: DS.attr('string'),
});
