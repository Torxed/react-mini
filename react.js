function getAllFuncs(obj, parent=null) {
			let functions = {};
			let subObject = Object.getPrototypeOf(obj);
			if(!subObject)
				return functions;
			if(!parent)
				parent = obj;

			Object.getOwnPropertyNames(subObject).forEach((item) => {
				functions[item] = {'owner' : parent, 'function' : subObject[item]}
			});

			functions = {...getAllFuncs(subObject, parent), ...functions};

			return functions;
		}

		class ObjectConstructor {
			constructor(params) {
				this.params = params;
				this.domObject = null;
				this._self = this;
			}

			build(element) {
				let obj = document.createElement(element);
				this.domObject = obj;
				
				//console.log('This when building:', this);
				//console.log(new Error().stack);
				this.set_attributes(this.params);
			}

			set_attributes(params) {
				let this_tmp = this;
				Object.keys(params).forEach(function(key) {
					this_tmp.domObject.setAttribute(key, params[key]);
				})
			}

			connect(obj) {
				if(typeof obj === 'string')
					obj = document.getElementById(obj);

				this.connected_to = obj;
				obj.appendChild(this.domObject);
				this.refresh();
			}

			refresh() {
				let oldObject = this.domObject; // For comparison operations
				let insideElements = this.component.render();
				this.build(oldObject.nodeName);
				insideElements.forEach((child) => {
					this.domObject.appendChild(child.domObject);
				})
				var children = this.connected_to.children;
				for (var i = 0; i < children.length; i++) {
					if(children[i] == oldObject)
						this.connected_to.replaceChild(this.domObject, children[i])
				}
			}
		}

		class html extends ObjectConstructor {
			constructor(_React) {
				super({});
				this.domObject = _React.domObject;
			}

			render() {
				return [this.domObject];
			}
		}

		class React extends ObjectConstructor {
			constructor(str, mapper={}) {
				// Do HTML parsing:
				let base_obj_repr = str.match(/<(.*?)>/)[1];
				let object_type = base_obj_repr.split(' ', 1)[0].match(/[a-zA-Z]+/g)[0];
				let start = ('<'+base_obj_repr+'>').length;
				let end = str.lastIndexOf('</'+object_type+'>');
				let content = str.substr(start, end-start);
				//

				// Create the new class() based on object_type from the HTML string
				let object_handle = null;
				try {
					object_handle = eval(object_type);
				} catch {
					object_handle = html;
				}
				let params = base_obj_repr.match(/([a-zA-Z0-9]+=".*?")/g);
				let obj_params = {};

				// We need to do super() after we've mapped all the parameters.
				// Otherwise id=".." won't get set.
				super(obj_params);
				this._self = this;

				if(params) {
					params.forEach((item) => {
						let [key, val] = item.split('=',2);
						let mappers = val.match(/{.*?}/g);
						if (mappers) {
							mappers.forEach((map_item) => {
								let var_name = map_item.substr(1, map_item.length-2);
								let mapped_item = null;
								// TODO: Handle this. type replacing. And try to figure out what this. refers to..
								if(typeof mapper[var_name] !== 'undefined')
									mapped_item = mapper[var_name];
								else if(typeof this[var_name] !== 'undefined')
									mapped_item = this[var_name];
								else if(typeof window[var_name] !== 'undefined')
									mapped_item = window[var_name];
								
								if (typeof mapped_item === 'string') {
									val = val.replace(map_item, mapped_item);
									console.log('Got a string:', map_item, mapped_item);
									obj_params[key] = val;
								} else {
									val = mapped_item;
								}
								this[key] = val;
							})
						} else {
							obj_params[key] = val;
						}
					});
				}

				this.build(object_type);
				this.component = new object_handle(this);
				this.state = this.component.state;
				// TODO: Handle more complex sub-elements.
				//       The 'content' can contain several nestet elements, convert these into html()
				this.domObject.innerHTML = content;

				return this.component;
			}
		}

		class Component {
			constructor(dynamic_object) {
				this.reactComponent = dynamic_object;
				this.state = this.reactComponent.state;
				this.domObject = this.reactComponent.domObject;
				this._self = this;
				let self = this;

				let functions = getAllFuncs(this.reactComponent);
				Object.keys(functions).forEach(function(func) {
					if(func == 'constructor' || func.indexOf('_') >= 0)
						return

					self[func] = function() {
						functions[func]['function'].call(functions[func]['owner'], ...arguments);
					}
				})
			}
		}
